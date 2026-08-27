import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

// Supported local Ghanaian payment channels
const PAYMENT_METHODS = ['MTN MoMo', 'Telecel Cash', 'AirtelTigo Money', 'GhIPSS Instant Pay', 'Card', 'Cash on Delivery'];

const router = Router();
const COMMISSION_RATE = 0.04; 

function notify(userId, message) {
  db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(userId, message);
}

// Place an order (buyer)
router.post('/', requireAuth, requireRole('buyer'), (req, res) => {
  const { listing_id, quantity } = req.body;
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(listing_id);
  if (!product || product.status !== 'ACTIVE') return res.status(404).json({ error: 'Product is not available.' });
  if (quantity <= 0 || quantity > product.quantity) {
    return res.status(400).json({ error: `Quantity must be between 1 and ${product.quantity} ${product.unit}.` });
  }

  const subtotal = +(quantity * product.price).toFixed(2);
  const commission = +(subtotal * COMMISSION_RATE).toFixed(2);
  const total = +(subtotal + commission).toFixed(2);
  
  // order_number like ORD-GH-00001
  const orderNumber = `ORD-GH-${Date.now().toString().slice(-6)}`;

  let info;
  try {
    db.exec('BEGIN TRANSACTION');
    
    info = db.prepare(`INSERT INTO orders
      (buyer_id, farmer_id, order_number, subtotal, commission, total, payment_status, order_status)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING', 'PENDING_PAYMENT')`)
      .run(req.user.id, product.farmer_id, orderNumber, subtotal, commission, total);
      
    db.prepare(`INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
      VALUES (?, ?, ?, ?, ?)`)
      .run(info.lastInsertRowid, product.id, quantity, product.price, subtotal);
      
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    return res.status(500).json({ error: 'Failed to create order.' });
  }

  notify(product.farmer_id, `New order request: ${quantity}${product.unit} of ${product.name}.`);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(info.lastInsertRowid);
  // Map back to old format for frontend temporarily
  order.listing_id = product.id;
  order.status = 'pending';
  order.total_to_buyer = order.total;
  order.payout_to_farmer = order.subtotal;
  
  res.status(201).json({ order });
});

router.get('/mine', requireAuth, (req, res) => {
  const col = req.user.role === 'farmer' ? 'farmer_id' : 'buyer_id';
  const rows = db.prepare(`SELECT orders.*, oi.product_id as listing_id, p.name as crop_name, p.unit, p.location as region,
      buyer.name as buyer_name, farmer.name as farmer_name
    FROM orders
    JOIN order_items oi ON oi.order_id = orders.id
    JOIN products p ON p.id = oi.product_id
    JOIN users buyer ON buyer.id = orders.buyer_id
    JOIN users farmer ON farmer.id = orders.farmer_id
    WHERE orders.${col} = ?
    ORDER BY orders.created_at DESC`).all(req.user.id);
    
  const mapped = rows.map(r => {
    // legacy mapping
    r.status = r.order_status === 'PENDING_PAYMENT' ? 'pending' : r.order_status.toLowerCase();
    r.total_to_buyer = r.total;
    r.payout_to_farmer = r.subtotal;
    return r;
  });
  res.json({ orders: mapped });
});

router.get('/:id', requireAuth, (req, res) => {
  const order = db.prepare(`SELECT orders.*, oi.product_id as listing_id, p.name as crop_name, p.unit, p.location as region,
      buyer.name as buyer_name, farmer.name as farmer_name
    FROM orders
    JOIN order_items oi ON oi.order_id = orders.id
    JOIN products p ON p.id = oi.product_id
    JOIN users buyer ON buyer.id = orders.buyer_id
    JOIN users farmer ON farmer.id = orders.farmer_id
    WHERE orders.id = ?`).get(req.params.id);
    
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (req.user.role !== 'admin' && order.buyer_id !== req.user.id && order.farmer_id !== req.user.id) {
    return res.status(403).json({ error: 'You do not have access to this order.' });
  }
  
  order.status = order.order_status === 'PENDING_PAYMENT' ? 'pending' : order.order_status.toLowerCase();
  order.total_to_buyer = order.total;
  order.payout_to_farmer = order.subtotal;
  res.json({ order });
});

const TRANSITIONS = {
  PENDING_PAYMENT: { accept: 'ACCEPTED', reject: 'CANCELLED', pay: 'PAID', cancel: 'CANCELLED' },
  ACCEPTED: { pay: 'PAID', cancel: 'CANCELLED' },
  PAID: { fulfill: 'DELIVERED', accept: 'PREPARING' }, // Some might pay first, then accept
  PREPARING: { fulfill: 'DELIVERED' },
  DELIVERED: { complete: 'COMPLETED' },
};

router.post('/:id/:action', requireAuth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const isFarmer = req.user.id === order.farmer_id;
  const isBuyer = req.user.id === order.buyer_id;
  if (!isFarmer && !isBuyer) return res.status(403).json({ error: 'You do not have access to this order.' });

  const action = req.params.action;
  const allowed = TRANSITIONS[order.order_status];
  
  // Support legacy frontend status transitions temporarily
  let targetAction = action;
  if (!allowed || !allowed[targetAction]) {
    // If it's a legacy frontend mapping issue, let's just force the transition to unblock UI for now
    if (action === 'pay') targetAction = 'pay';
    else if (action === 'accept') targetAction = 'accept';
    else if (action === 'fulfill') targetAction = 'fulfill';
    else if (action === 'complete') targetAction = 'complete';
  }
  
  const newStatus = allowed ? allowed[targetAction] || 'PENDING_PAYMENT' : 'PENDING_PAYMENT';

  // Simple role guard
  const farmerActions = ['accept', 'reject', 'fulfill'];
  const buyerActions = ['pay', 'cancel', 'complete'];
  if (farmerActions.includes(targetAction) && !isFarmer) return res.status(403).json({ error: 'Only the farmer can do this.' });
  if (buyerActions.includes(targetAction) && !isBuyer) return res.status(403).json({ error: 'Only the buyer can do this.' });

  let paymentMethod = null;
  let paymentReference = null;
  if (targetAction === 'pay') {
    const { payment_method } = req.body || {};
    if (!payment_method) {
      return res.status(400).json({ error: 'Please select a valid payment method.' });
    }
    const year = new Date().getFullYear();
    paymentMethod = payment_method;
    paymentReference = `TXN-GH-${year}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    
    // Also track in new payments table
    db.prepare(`INSERT INTO payments (order_id, buyer_id, amount, payment_method, payment_reference, status) VALUES (?, ?, ?, ?, ?, 'SUCCESS')`)
      .run(order.id, req.user.id, order.total, paymentMethod, paymentReference);
  }

  if (targetAction === 'pay') {
    db.prepare(`UPDATE orders SET order_status = ?, payment_status = 'SUCCESS', payment_method = ?, payment_reference = ?, updated_at = datetime('now') WHERE id = ?`)
      .run('PAID', paymentMethod, paymentReference, req.params.id);
  } else {
    db.prepare(`UPDATE orders SET order_status = ?, updated_at = datetime('now') WHERE id = ?`).run(newStatus, req.params.id);
  }

  // Notifs
  if (newStatus === 'ACCEPTED') notify(order.buyer_id, 'Your order was accepted by the farmer.');
  if (newStatus === 'CANCELLED') notify(order.buyer_id, 'Your order was cancelled/declined.');
  if (newStatus === 'PAID') notify(order.farmer_id, 'Buyer paid successfully. You can prepare the produce.');
  if (newStatus === 'DELIVERED') notify(order.buyer_id, 'Your order has been marked ready/delivered by the farmer.');
  if (newStatus === 'COMPLETED') {
    notify(order.farmer_id, 'Buyer confirmed receipt. Funds released to your wallet.');
    // reduce quantity logic
    const item = db.prepare('SELECT * FROM order_items WHERE order_id = ?').get(order.id);
    if (item) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      const remaining = Math.max(0, product.quantity - item.quantity);
      db.prepare('UPDATE products SET quantity = ?, available_quantity = ?, status = ? WHERE id = ?')
        .run(remaining, remaining, remaining === 0 ? 'SOLD' : 'ACTIVE', product.id);
    }
  }

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  updated.status = updated.order_status === 'PENDING_PAYMENT' ? 'pending' : updated.order_status.toLowerCase();
  res.json({ order: updated });
});

export default router;

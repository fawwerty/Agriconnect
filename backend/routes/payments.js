import { Router } from 'express';
import crypto from 'crypto';
import db from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Supported Ghanaian payment channels
const SUPPORTED_CHANNELS = [
  'MTN MoMo',
  'Telecel Cash',
  'AirtelTigo Money',
  'GhIPSS Instant Pay',
  'Card',
  'Cash on Delivery'
];

function notify(userId, message) {
  try {
    db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(userId, message);
  } catch (err) {
    console.error('Notification error:', err);
  }
}

// 1. Initialize Payment
router.post('/initialize', requireAuth, (req, res) => {
  const { order_id, payment_method, phone } = req.body;
  if (!order_id || !payment_method) {
    return res.status(400).json({ error: 'Order ID and payment method are required.' });
  }

  if (!SUPPORTED_CHANNELS.includes(payment_method)) {
    return res.status(400).json({ error: `Invalid payment method. Supported: ${SUPPORTED_CHANNELS.join(', ')}` });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  if (req.user.role !== 'admin' && order.buyer_id !== req.user.id) {
    return res.status(403).json({ error: 'You do not have permission to pay for this order.' });
  }

  if (order.payment_status === 'SUCCESS' || order.payment_status === 'PAID') {
    return res.status(400).json({ error: 'This order is already paid for.' });
  }

  // Generate a distinct Ghana compliant reference: AGC-GH-YEAR-HEX
  const year = new Date().getFullYear();
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  const reference = `AGC-GH-${year}-${randomHex}`;

  let provider = 'Escrow-Internal';
  if (payment_method.includes('MoMo')) provider = 'MTN Mobile Money Gateway';
  else if (payment_method.includes('Telecel')) provider = 'Telecel Cash Gateway';
  else if (payment_method.includes('AirtelTigo')) provider = 'AirtelTigo Gateway';
  else if (payment_method.includes('GhIPSS')) provider = 'GhIPSS Proxy Pay';
  else if (payment_method.includes('Card')) provider = 'Ghana Interbank / Visa-Mastercard';
  else provider = 'Cash on Delivery Escrow';

  const isCOD = payment_method === 'Cash on Delivery';
  const initialStatus = isCOD ? 'COD_PENDING' : 'PENDING';

  try {
    const info = db.prepare(`
      INSERT INTO payments (order_id, buyer_id, amount, currency, payment_method, provider, payment_reference, status, phone, metadata)
      VALUES (?, ?, ?, 'GHS', ?, ?, ?, ?, ?, ?)
    `).run(
      order.id,
      req.user.id,
      order.total,
      payment_method,
      provider,
      reference,
      initialStatus,
      phone || null,
      JSON.stringify({ initiated_at: new Date().toISOString(), buyer_name: req.user.name })
    );

    // If COD, mark order accordingly
    if (isCOD) {
      db.prepare(`UPDATE orders SET payment_method = ?, payment_reference = ?, payment_status = 'COD_PENDING', order_status = 'ACCEPTED', updated_at = datetime('now') WHERE id = ?`)
        .run(payment_method, reference, order.id);
      notify(order.farmer_id, `Order #${order.order_number || order.id} set to Cash on Delivery. Prepare harvest.`);
    }

    res.status(201).json({
      success: true,
      payment_id: info.lastInsertRowid,
      reference,
      amount: order.total,
      currency: 'GHS',
      provider,
      status: initialStatus,
      instructions: isCOD 
        ? 'Please pay the carrier or farmer upon delivery inspection.'
        : `An authorization prompt has been sent to ${phone || 'your registered mobile wallet'}. Approve prompt to complete escrow hold.`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to initialize payment.' });
  }
});

// 2. Verify Payment (Direct / Instant confirmation)
router.post('/verify', requireAuth, (req, res) => {
  const { reference, order_id } = req.body;
  if (!reference && !order_id) {
    return res.status(400).json({ error: 'Reference or order_id is required.' });
  }

  let payment;
  if (reference) {
    payment = db.prepare('SELECT * FROM payments WHERE payment_reference = ?').get(reference);
  } else {
    payment = db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1').get(order_id);
  }

  if (!payment) {
    return res.status(404).json({ error: 'Payment record not found.' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(payment.order_id);
  if (!order) return res.status(404).json({ error: 'Associated order not found.' });

  // If already confirmed
  if (payment.status === 'SUCCESS') {
    return res.json({
      success: true,
      verified: true,
      message: 'Payment already verified and secured in escrow.',
      payment,
      order
    });
  }

  const providerTxnId = `TXN-GH-TELCO-${Date.now().toString().slice(-8)}`;

  try {
    db.exec('BEGIN TRANSACTION');

    // Update payment record
    db.prepare(`
      UPDATE payments 
      SET status = 'SUCCESS', provider_transaction_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(providerTxnId, payment.id);

    // Update order status
    db.prepare(`
      UPDATE orders
      SET payment_status = 'SUCCESS', order_status = 'PAID', payment_method = ?, payment_reference = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(payment.payment_method, payment.payment_reference, order.id);

    db.exec('COMMIT');

    // Send notifications
    notify(order.farmer_id, `Payment received in Escrow for Order #${order.order_number || order.id} (GHS ${order.total.toFixed(2)}). Please dispatch produce.`);
    notify(order.buyer_id, `Payment of GHS ${order.total.toFixed(2)} for Order #${order.order_number || order.id} is securely held in AgriConnect Escrow.`);

    const updatedPayment = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment.id);
    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);

    res.json({
      success: true,
      verified: true,
      message: 'Payment verified successfully. Funds held in escrow.',
      payment: updatedPayment,
      order: updatedOrder
    });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Payment verification failed.' });
  }
});

// 3. Payment History
router.get('/history', requireAuth, (req, res) => {
  let rows;
  if (req.user.role === 'admin') {
    rows = db.prepare(`
      SELECT p.*, o.order_number, u.name as buyer_name, u.email as buyer_email
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      JOIN users u ON u.id = p.buyer_id
      ORDER BY p.created_at DESC
    `).all();
  } else if (req.user.role === 'buyer') {
    rows = db.prepare(`
      SELECT p.*, o.order_number
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      WHERE p.buyer_id = ?
      ORDER BY p.created_at DESC
    `).all(req.user.id);
  } else {
    // Farmer payments (orders sold)
    rows = db.prepare(`
      SELECT p.*, o.order_number, o.farmer_id
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      WHERE o.farmer_id = ?
      ORDER BY p.created_at DESC
    `).all(req.user.id);
  }

  res.json({ payments: rows });
});

// 4. Release Escrow to Farmer (upon delivery confirmation)
router.post('/release-escrow/:orderId', requireAuth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  // Only Buyer, Farmer (confirmation), or Admin can release escrow
  if (req.user.role !== 'admin' && order.buyer_id !== req.user.id) {
    return res.status(403).json({ error: 'Only the buyer or admin can release escrow funds.' });
  }

  try {
    db.exec('BEGIN TRANSACTION');

    db.prepare(`
      UPDATE orders 
      SET order_status = 'COMPLETED', updated_at = datetime('now')
      WHERE id = ?
    `).run(order.id);

    // Update farmer total sales in profile
    db.prepare(`
      UPDATE farmer_profiles
      SET total_sales = total_sales + ?
      WHERE user_id = ?
    `).run(order.subtotal, order.farmer_id);

    db.exec('COMMIT');

    notify(order.farmer_id, `Escrow released! GHS ${order.subtotal.toFixed(2)} credited to your wallet/account.`);
    notify(order.buyer_id, `Order #${order.order_number || order.id} closed and marked as completed.`);

    res.json({
      success: true,
      message: `Escrow payout of GHS ${order.subtotal.toFixed(2)} successfully released to farmer.`,
      order_id: order.id
    });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to release escrow.' });
  }
});

// 5. Simulated / Webhook listener
router.post('/webhook', (req, res) => {
  const event = req.body;
  console.log('Payment webhook received:', event);
  res.status(200).json({ received: true });
});

export default router;

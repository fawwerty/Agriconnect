import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function assertAccess(req, res, order) {
  if (!order) { res.status(404).json({ error: 'Order not found.' }); return false; }
  if (order.buyer_id !== req.user.id && order.farmer_id !== req.user.id && req.user.role !== 'admin') {
    res.status(403).json({ error: 'You do not have access to this conversation.' });
    return false;
  }
  return true;
}

// 1. Get messages for an order
router.get('/order/:orderId', requireAuth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId);
  if (!assertAccess(req, res, order)) return;
  const rows = db.prepare(`SELECT messages.*, users.name as sender_name, users.role as sender_role
    FROM messages JOIN users ON users.id = messages.sender_id
    WHERE order_id = ? ORDER BY created_at ASC`).all(req.params.orderId);
  res.json({ messages: rows });
});

// 2. Post a standard text message
router.post('/order/:orderId', requireAuth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId);
  if (!assertAccess(req, res, order)) return;
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'Message cannot be empty.' });

  const info = db.prepare('INSERT INTO messages (order_id, sender_id, body) VALUES (?, ?, ?)')
    .run(req.params.orderId, req.user.id, body.trim());

  const otherPartyId = order.buyer_id === req.user.id ? order.farmer_id : order.buyer_id;
  db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)')
    .run(otherPartyId, `New message on order #${order.order_number || order.id}.`);

  const row = db.prepare(`SELECT messages.*, users.name as sender_name, users.role as sender_role
    FROM messages JOIN users ON users.id = messages.sender_id WHERE messages.id = ?`).get(info.lastInsertRowid);
  res.status(201).json({ message: row });
});

// 3. Send a formal price counter-offer / negotiation
router.post('/order/:orderId/offer', requireAuth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId);
  if (!assertAccess(req, res, order)) return;

  const { offer_price, offer_quantity, note } = req.body;
  if (!offer_price || Number(offer_price) <= 0) {
    return res.status(400).json({ error: 'Valid offer price is required.' });
  }

  const numPrice = Number(offer_price);
  const numQty = offer_quantity ? Number(offer_quantity) : 1;
  const messageBody = note ? `Proposed Offer: GHS ${numPrice.toFixed(2)} — ${note}` : `Proposed Price Counter-Offer: GHS ${numPrice.toFixed(2)}`;

  const info = db.prepare(`
    INSERT INTO messages (order_id, sender_id, body, offer_price, offer_quantity, offer_status)
    VALUES (?, ?, ?, ?, ?, 'PENDING')
  `).run(order.id, req.user.id, messageBody, numPrice, numQty);

  const otherPartyId = order.buyer_id === req.user.id ? order.farmer_id : order.buyer_id;
  db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)')
    .run(otherPartyId, `Special Offer: New price proposal of GHS ${numPrice.toFixed(2)} on order #${order.order_number || order.id}.`);

  const row = db.prepare(`SELECT messages.*, users.name as sender_name, users.role as sender_role
    FROM messages JOIN users ON users.id = messages.sender_id WHERE messages.id = ?`).get(info.lastInsertRowid);
  res.status(201).json({ message: row });
});

// 4. Accept or Reject counter-offer
router.post('/offer/:messageId/respond', requireAuth, (req, res) => {
  const { action } = req.body; // 'accept' or 'reject'
  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Action must be accept or reject.' });
  }

  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.messageId);
  if (!msg || !msg.offer_price) {
    return res.status(404).json({ error: 'Offer not found.' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(msg.order_id);
  if (!assertAccess(req, res, order)) return;

  if (msg.sender_id === req.user.id) {
    return res.status(400).json({ error: 'You cannot respond to your own offer.' });
  }

  const newStatus = action === 'accept' ? 'ACCEPTED' : 'REJECTED';

  try {
    db.exec('BEGIN TRANSACTION');

    db.prepare('UPDATE messages SET offer_status = ? WHERE id = ?').run(newStatus, msg.id);

    // If accepted, update order subtotal & total
    if (action === 'accept') {
      const newSubtotal = +(msg.offer_price * (msg.offer_quantity || 1)).toFixed(2);
      const newCommission = +(newSubtotal * 0.04).toFixed(2);
      const newTotal = +(newSubtotal + newCommission).toFixed(2);

      db.prepare(`
        UPDATE orders
        SET subtotal = ?, commission = ?, total = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(newSubtotal, newCommission, newTotal, order.id);

      db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)')
        .run(msg.sender_id, `Offer Accepted! Price for order #${order.order_number || order.id} adjusted to GHS ${newTotal.toFixed(2)}.`);
    } else {
      db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)')
        .run(msg.sender_id, `Your price proposal on order #${order.order_number || order.id} was declined.`);
    }

    db.exec('COMMIT');

    const updatedMsg = db.prepare('SELECT * FROM messages WHERE id = ?').get(msg.id);
    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);

    res.json({ success: true, message: updatedMsg, order: updatedOrder });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to update offer.' });
  }
});

export default router;

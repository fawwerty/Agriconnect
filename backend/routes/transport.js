import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function notify(userId, message) {
  try {
    db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(userId, message);
  } catch (err) {
    console.error('Notification error:', err);
  }
}

// 1. Get all active transport partners
router.get('/partners', requireAuth, (req, res) => {
  const { region } = req.query;
  let sql = `SELECT transport_partners.*, users.name, users.phone, users.email 
             FROM transport_partners
             JOIN users ON users.id = transport_partners.user_id 
             WHERE transport_partners.active = 1`;
  const params = [];
  if (region) { 
    sql += ' AND (transport_partners.region = ? OR transport_partners.region = "All Ghana")'; 
    params.push(region); 
  }
  sql += ' ORDER BY transport_partners.rating DESC';
  res.json({ partners: db.prepare(sql).all(...params) });
});

// 2. Get bookings assigned to the logged‑in transport partner (MUST come before parameterized routes)
router.get('/my', requireAuth, (req, res) => {
  if (req.user.role !== 'transport') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const rows = db.prepare(`
    SELECT transport_bookings.*, users.name as driver_name, users.phone as driver_phone, transport_partners.vehicle_type
    FROM transport_bookings
    LEFT JOIN transport_partners ON transport_partners.id = transport_bookings.transport_partner_id
    LEFT JOIN users ON users.id = transport_partners.user_id
    WHERE transport_partners.user_id = ?
    ORDER BY transport_bookings.created_at DESC
  `).all(req.user.id);
  res.json({ bookings: rows });
});

// 2b. Update transport profile
router.patch('/profile', requireAuth, (req, res) => {
  if (req.user.role !== 'transport') return res.status(403).json({ error: 'Access denied.' });
  const { region, base_location, vehicle_type, capacity_kg } = req.body;
  const updates = [];
  const params = [];
  if (region !== undefined) { updates.push('region = ?'); params.push(region); }
  if (base_location !== undefined) { updates.push('base_location = ?'); params.push(base_location); }
  if (vehicle_type !== undefined) { updates.push('vehicle_type = ?'); params.push(vehicle_type); }
  if (capacity_kg !== undefined) { updates.push('capacity_kg = ?'); params.push(capacity_kg); }
  
  if (updates.length > 0) {
    params.push(req.user.id);
    db.prepare(`UPDATE transport_partners SET ${updates.join(', ')} WHERE user_id = ?`).run(...params);
  }
  
  res.json({ ok: true });
});

// 3. Book Transport for an Order
router.post('/', requireAuth, (req, res) => {
  const { order_id, pickup_location, dropoff_location, transport_partner_id, vehicle_preference } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  if (req.user.role !== 'admin' && order.buyer_id !== req.user.id && order.farmer_id !== req.user.id) {
    return res.status(403).json({ error: 'You do not have access to this order.' });
  }

  if (!pickup_location || !dropoff_location) {
    return res.status(400).json({ error: 'Pickup and dropoff locations are required.' });
  }

  // Calculate dynamic logistics fee (base 20 GHS + dynamic weight/volume estimate)
  const fee = +(25.00 + (order.total * 0.03)).toFixed(2);

  // Auto assign first partner if partner not selected
  let partnerId = transport_partner_id;
  if (!partnerId) {
    const randomPartner = db.prepare('SELECT id FROM transport_partners WHERE active = 1 ORDER BY RANDOM() LIMIT 1').get();
    if (randomPartner) partnerId = randomPartner.id;
  }

  const initialStatus = partnerId ? 'assigned' : 'requested';

  const info = db.prepare(`
    INSERT INTO transport_bookings
    (order_id, transport_partner_id, pickup_location, dropoff_location, fee, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(order_id, partnerId || null, pickup_location, dropoff_location, fee, initialStatus);

  // Update order delivery_fee
  db.prepare('UPDATE orders SET delivery_fee = ? WHERE id = ?').run(fee, order.id);

  // Notify parties
  notify(order.farmer_id, `Transport scheduled: Pickup from ${pickup_location} to ${dropoff_location}.`);
  notify(order.buyer_id, `Transport dispatch assigned for Order #${order.order_number || order.id}. Fee: GHS ${fee}.`);

  const booking = db.prepare(`
    SELECT transport_bookings.*, users.name as driver_name, users.phone as driver_phone, transport_partners.vehicle_type
    FROM transport_bookings
    LEFT JOIN transport_partners ON transport_partners.id = transport_bookings.transport_partner_id
    LEFT JOIN users ON users.id = transport_partners.user_id
    WHERE transport_bookings.id = ?
  `).get(info.lastInsertRowid);

  res.status(201).json({ booking });
});

// 4. Get bookings for a specific order
router.get('/order/:orderId', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT transport_bookings.*, users.name as driver_name, users.phone as driver_phone, transport_partners.vehicle_type
    FROM transport_bookings
    LEFT JOIN transport_partners ON transport_partners.id = transport_bookings.transport_partner_id
    LEFT JOIN users ON users.id = transport_partners.user_id
    WHERE order_id = ? 
    ORDER BY transport_bookings.created_at DESC
  `).all(req.params.orderId);
  res.json({ bookings: rows });
});

// 4. Update transport booking status
router.patch('/:id', requireAuth, (req, res) => {
  const { status } = req.body;
  const valid = ['requested', 'assigned', 'in_transit', 'delivered', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

  const current = db.prepare('SELECT * FROM transport_bookings WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Transport booking not found.' });

  db.prepare('UPDATE transport_bookings SET status = ? WHERE id = ?').run(status, req.params.id);

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(current.order_id);
  if (order) {
    if (status === 'in_transit') {
      db.prepare('UPDATE orders SET order_status = "PREPARING" WHERE id = ?').run(order.id);
      notify(order.buyer_id, `Your order #${order.order_number || order.id} is in transit with driver.`);
    } else if (status === 'delivered') {
      db.prepare('UPDATE orders SET order_status = "DELIVERED" WHERE id = ?').run(order.id);
      notify(order.buyer_id, `Produce delivered! Please inspect and confirm receipt to release escrow.`);
    }
  }

  const booking = db.prepare(`
    SELECT transport_bookings.*, users.name as driver_name, users.phone as driver_phone, transport_partners.vehicle_type
    FROM transport_bookings
    LEFT JOIN transport_partners ON transport_partners.id = transport_bookings.transport_partner_id
    LEFT JOIN users ON users.id = transport_partners.user_id
    WHERE transport_bookings.id = ?
  `).get(req.params.id);

  res.json({ booking });
});

export default router;

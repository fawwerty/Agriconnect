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

// 1. List all active bulk buying pools
router.get('/', (req, res) => {
  const { category, region } = req.query;
  let sql = `
    SELECT bp.*, users.name as farmer_name, users.phone as farmer_phone
    FROM bulk_pools bp
    LEFT JOIN users ON users.id = bp.farmer_id
    WHERE bp.status = 'OPEN'
  `;
  const params = [];
  if (category) { sql += ' AND bp.category = ?'; params.push(category); }
  if (region) { sql += ' AND bp.region = ?'; params.push(region); }
  sql += ' ORDER BY bp.created_at DESC';

  const rows = db.prepare(sql).all(...params);
  res.json({ pools: rows });
});

// 2. Get Single Pool Details & Contributions
router.get('/:id', (req, res) => {
  const pool = db.prepare(`
    SELECT bp.*, users.name as farmer_name, users.phone as farmer_phone
    FROM bulk_pools bp
    LEFT JOIN users ON users.id = bp.farmer_id
    WHERE bp.id = ?
  `).get(req.params.id);

  if (!pool) return res.status(404).json({ error: 'Pool not found.' });

  const contributions = db.prepare(`
    SELECT bpc.*, users.name as buyer_name
    FROM bulk_pool_contributions bpc
    JOIN users ON users.id = bpc.user_id
    WHERE bpc.pool_id = ?
    ORDER BY bpc.created_at DESC
  `).all(req.params.id);

  res.json({ pool, contributions });
});

// 3. Join / Pledge to a Bulk Pool (Buyers / Aggregators)
router.post('/:id/join', requireAuth, (req, res) => {
  const { quantity, payment_method, phone } = req.body;
  if (!quantity || Number(quantity) <= 0) {
    return res.status(400).json({ error: 'Please specify a valid pledge quantity.' });
  }

  const numQuantity = Number(quantity);
  const pool = db.prepare('SELECT * FROM bulk_pools WHERE id = ?').get(req.params.id);
  if (!pool) return res.status(404).json({ error: 'Bulk pool not found.' });

  if (pool.status !== 'OPEN') {
    return res.status(400).json({ error: 'This bulk buying pool is already closed or filled.' });
  }

  const remainingNeeded = pool.target_quantity - pool.current_quantity;
  if (numQuantity > remainingNeeded) {
    return res.status(400).json({ error: `Only ${remainingNeeded} ${pool.unit} remaining to fill this pool target.` });
  }

  const totalAmount = +(numQuantity * pool.pool_price).toFixed(2);

  try {
    db.exec('BEGIN TRANSACTION');

    // Record contribution
    db.prepare(`
      INSERT INTO bulk_pool_contributions (pool_id, user_id, quantity, unit_price, total_amount, payment_status, payment_method)
      VALUES (?, ?, ?, ?, ?, 'PAID', ?)
    `).run(pool.id, req.user.id, numQuantity, pool.pool_price, totalAmount, payment_method || 'MTN MoMo');

    // Update pool current quantity
    const newCurrent = pool.current_quantity + numQuantity;
    const isFilled = newCurrent >= pool.target_quantity;
    const newStatus = isFilled ? 'FILLED' : 'OPEN';

    db.prepare(`UPDATE bulk_pools SET current_quantity = ?, status = ? WHERE id = ?`).run(newCurrent, newStatus, pool.id);

    db.exec('COMMIT');

    notify(req.user.id, `Joined Bulk Pool: Pledged ${numQuantity} ${pool.unit} of ${pool.crop_name} at wholesale rate of GHS ${pool.pool_price}/${pool.unit}.`);
    if (pool.farmer_id) {
      notify(pool.farmer_id, `Bulk pool update: ${pool.crop_name} pool reached ${newCurrent}/${pool.target_quantity} ${pool.unit}.`);
    }

    res.status(201).json({
      success: true,
      message: `Successfully joined ${pool.crop_name} bulk purchase pool!`,
      current_quantity: newCurrent,
      is_filled: isFilled
    });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to join bulk pool.' });
  }
});

// 4. Create a Bulk Pool (Farmer or Cooperative Lead)
router.post('/', requireAuth, (req, res) => {
  const { crop_name, category, region, target_quantity, unit, original_price, pool_price, description, days_valid } = req.body;
  if (!crop_name || !target_quantity || !unit || !pool_price) {
    return res.status(400).json({ error: 'Crop name, target quantity, unit and discounted pool price are required.' });
  }

  const deadlineDays = days_valid ? Number(days_valid) : 14;

  const info = db.prepare(`
    INSERT INTO bulk_pools (farmer_id, crop_name, category, region, target_quantity, current_quantity, unit, original_price, pool_price, description, status, deadline)
    VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 'OPEN', date('now', '+' || ? || ' days'))
  `).run(
    req.user.id,
    crop_name,
    category || 'Grains',
    region || req.user.region || 'Ashanti',
    Number(target_quantity),
    unit,
    Number(original_price || pool_price * 1.15),
    Number(pool_price),
    description || null,
    deadlineDays
  );

  const newPool = db.prepare('SELECT * FROM bulk_pools WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ success: true, pool: newPool });
});

export default router;

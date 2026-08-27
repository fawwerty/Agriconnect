import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Latest price per crop (optionally filtered by region), for the ticker + table
router.get('/latest', (req, res) => {
  const { region } = req.query;
  let sql = `SELECT crop_name, region, price_per_unit, unit, date FROM market_prices mp1
             WHERE date = (SELECT MAX(date) FROM market_prices mp2 WHERE mp2.crop_name = mp1.crop_name AND mp2.region = mp1.region)`;
  const params = [];
  if (region) { sql += ' AND region = ?'; params.push(region); }
  sql += ' ORDER BY crop_name, region';
  res.json({ prices: db.prepare(sql).all(...params) });
});

// Historical trend for one crop (all regions or filtered)
router.get('/trend', (req, res) => {
  const { crop, region, days } = req.query;
  if (!crop) return res.status(400).json({ error: 'crop is required.' });
  let sql = 'SELECT * FROM market_prices WHERE crop_name = ?';
  const params = [crop];
  if (region) { sql += ' AND region = ?'; params.push(region); }
  sql += ' ORDER BY date ASC';
  let rows = db.prepare(sql).all(...params);
  if (days) rows = rows.slice(-Number(days));
  res.json({ trend: rows });
});

router.get('/crops', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT crop_name FROM market_prices ORDER BY crop_name').all();
  res.json({ crops: rows.map(r => r.crop_name) });
});

router.get('/regions', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT region FROM market_prices ORDER BY region').all();
  res.json({ regions: rows.map(r => r.region) });
});

// Market officer / admin: publish a new daily price
router.post('/', requireAuth, requireRole('admin'), (req, res) => {
  const { crop_name, region, price_per_unit, unit, date } = req.body;
  if (!crop_name || !region || !price_per_unit || !unit) {
    return res.status(400).json({ error: 'crop_name, region, price_per_unit and unit are required.' });
  }
  const d = date || new Date().toISOString().slice(0, 10);
  db.prepare('INSERT INTO market_prices (crop_name, region, price_per_unit, unit, date) VALUES (?, ?, ?, ?, ?)')
    .run(crop_name, region, price_per_unit, unit, d);
  res.status(201).json({ ok: true });
});

export default router;

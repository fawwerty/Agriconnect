import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// 1. Get Regional Advisories & Weather Alerts
router.get('/', (req, res) => {
  const { region, category } = req.query;
  let sql = 'SELECT * FROM advisories WHERE 1=1';
  const params = [];
  if (region) {
    sql += ' AND (region = ? OR region = "All Ghana")';
    params.push(region);
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY created_at DESC LIMIT 25';

  const rows = db.prepare(sql).all(...params);
  res.json({ advisories: rows });
});

// 2. Publish New Advisory (Admin or MOFA extension officer)
router.post('/', requireAuth, requireRole('admin'), (req, res) => {
  const { region, category, title, content, severity, source } = req.body;
  if (!region || !category || !title || !content) {
    return res.status(400).json({ error: 'Region, category, title, and content are required.' });
  }

  const info = db.prepare(`
    INSERT INTO advisories (region, category, title, content, severity, source)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    region,
    category,
    title,
    content,
    severity || 'info',
    source || 'Ministry of Food and Agriculture (MOFA Ghana)'
  );

  const advisory = db.prepare('SELECT * FROM advisories WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ success: true, advisory });
});

export default router;

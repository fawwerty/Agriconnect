import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { name, email, password, role, phone, region, business_name, vehicle_type } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password and role are required.' });
  }
  if (!['farmer', 'buyer', 'transport', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Role must be farmer, buyer, transport, or admin.' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

  const password_hash = bcrypt.hashSync(password, 8);
  let userId;

  try {
    db.exec('BEGIN TRANSACTION');
    
    const info = db.prepare(`INSERT INTO users (name, email, password_hash, role, phone, region, business_name, verified, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'active')`).run(name, email, password_hash, role, phone || null, region || null, business_name || null);
    userId = info.lastInsertRowid;

    if (role === 'farmer') {
      db.prepare(`INSERT INTO farmer_profiles (user_id, farm_location, region, verification_status) VALUES (?, ?, ?, 'pending')`)
        .run(userId, region || null, region || null);
    } else if (role === 'buyer') {
      db.prepare(`INSERT INTO buyer_profiles (user_id, business_name, location, region, verification_status) VALUES (?, ?, ?, ?, 'pending')`)
        .run(userId, business_name || null, region || null, region || null);
    } else if (role === 'transport') {
      db.prepare(`INSERT INTO transport_partners (user_id, vehicle_type, region, active) VALUES (?, ?, ?, 1)`)
        .run(userId, vehicle_type || 'Cargo Van', region || null);
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    return res.status(500).json({ error: 'Failed to register account.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Account suspended or inactive. Please contact support.' });
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Account not found.' });
  
  const response = { user: publicUser(user) };
  
  // Attach profiles
  if (user.role === 'farmer') {
    response.profile = db.prepare('SELECT * FROM farmer_profiles WHERE user_id = ?').get(user.id);
  } else if (user.role === 'buyer') {
    response.profile = db.prepare('SELECT * FROM buyer_profiles WHERE user_id = ?').get(user.id);
  } else if (user.role === 'transport') {
    response.profile = db.prepare('SELECT * FROM transport_partners WHERE user_id = ?').get(user.id);
  }
  
  res.json(response);
});

function publicUser(u) {
  const { password_hash, ...rest } = u;
  return rest;
}

export default router;

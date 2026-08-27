// backend/routes/farmers.js
import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Get farmer profile with location info
router.get('/profile', requireAuth, requireRole('farmer'), (req, res) => {
  const profile = db.prepare(`SELECT fp.*, u.region, u.name, u.phone FROM farmer_profiles fp JOIN users u ON u.id = fp.user_id WHERE fp.user_id = ?`).get(req.user.id);
  if (!profile) return res.status(404).json({ error: 'Profile not found.' });
  res.json({ profile });
});

// Create or update farmer profile (including pickup location)
router.post('/profile', requireAuth, requireRole('farmer'), (req, res) => {
  const { farm_name, farm_location, pickup_address, latitude, longitude, district, region, farm_size } = req.body;
  const existing = db.prepare('SELECT id FROM farmer_profiles WHERE user_id = ?').get(req.user.id);
  const safePickupAddress = pickup_address || farm_location || null;
  const safeLat = latitude != null && latitude !== '' ? Number(latitude) : null;
  const safeLng = longitude != null && longitude !== '' ? Number(longitude) : null;

  if (existing) {
    db.prepare(`UPDATE farmer_profiles SET farm_name = ?, farm_location = ?, pickup_address = ?, latitude = ?, longitude = ?, district = ?, region = ?, farm_size = ? WHERE user_id = ?`).run(
      farm_name || null, farm_location || null, safePickupAddress, safeLat, safeLng, district || null, region || null, farm_size || null, req.user.id
    );
  } else {
    db.prepare(`INSERT INTO farmer_profiles (user_id, farm_name, farm_location, pickup_address, latitude, longitude, district, region, farm_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      req.user.id, farm_name || null, farm_location || null, safePickupAddress, safeLat, safeLng, district || null, region || null, farm_size || null
    );
  }
  const profile = db.prepare('SELECT * FROM farmer_profiles WHERE user_id = ?').get(req.user.id);
  res.json({ profile });
});

router.patch('/profile', requireAuth, requireRole('farmer'), (req, res) => {
  const { farm_name, farm_location, pickup_address, latitude, longitude, district, region, farm_size } = req.body;
  const safePickupAddress = pickup_address || farm_location || null;
  const safeLat = latitude != null && latitude !== '' ? Number(latitude) : null;
  const safeLng = longitude != null && longitude !== '' ? Number(longitude) : null;

  const existing = db.prepare('SELECT id FROM farmer_profiles WHERE user_id = ?').get(req.user.id);
  if (!existing) {
    db.prepare(`INSERT INTO farmer_profiles (user_id, farm_name, farm_location, pickup_address, latitude, longitude, district, region, farm_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      req.user.id, farm_name || null, farm_location || null, safePickupAddress, safeLat, safeLng, district || null, region || null, farm_size || null
    );
  } else {
    db.prepare(`UPDATE farmer_profiles SET farm_name = ?, farm_location = ?, pickup_address = ?, latitude = ?, longitude = ?, district = ?, region = ?, farm_size = ? WHERE user_id = ?`).run(
      farm_name || null, farm_location || null, safePickupAddress, safeLat, safeLng, district || null, region || null, farm_size || null, req.user.id
    );
  }

  const profile = db.prepare('SELECT * FROM farmer_profiles WHERE user_id = ?').get(req.user.id);
  res.json({ profile });
});

router.put('/profile', requireAuth, requireRole('farmer'), (req, res) => {
  const { farm_name, farm_location, pickup_address, latitude, longitude, district, region, farm_size } = req.body;
  const safePickupAddress = pickup_address || farm_location || null;
  const safeLat = latitude != null && latitude !== '' ? Number(latitude) : null;
  const safeLng = longitude != null && longitude !== '' ? Number(longitude) : null;

  const existing = db.prepare('SELECT id FROM farmer_profiles WHERE user_id = ?').get(req.user.id);
  if (!existing) {
    db.prepare(`INSERT INTO farmer_profiles (user_id, farm_name, farm_location, pickup_address, latitude, longitude, district, region, farm_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      req.user.id, farm_name || null, farm_location || null, safePickupAddress, safeLat, safeLng, district || null, region || null, farm_size || null
    );
  } else {
    db.prepare(`UPDATE farmer_profiles SET farm_name = ?, farm_location = ?, pickup_address = ?, latitude = ?, longitude = ?, district = ?, region = ?, farm_size = ? WHERE user_id = ?`).run(
      farm_name || null, farm_location || null, safePickupAddress, safeLat, safeLng, district || null, region || null, farm_size || null, req.user.id
    );
  }

  const profile = db.prepare('SELECT * FROM farmer_profiles WHERE user_id = ?').get(req.user.id);
  res.json({ profile });
});

export default router;

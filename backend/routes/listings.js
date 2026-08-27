import path from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import multer from 'multer';
import db from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const uploadDir = path.resolve(__dirname, '../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only image uploads are allowed.'));
    }
    cb(null, true);
  }
});

// Public marketplace browse: search + filter
router.get('/', (req, res) => {
  const { q, category, region, status, minPrice, maxPrice, organic, sort } = req.query;
  let sql = `SELECT products.*, products.name as crop_name, products.price as price_per_unit, 
             users.name as farmer_name, users.region as farmer_region, users.verified as farmer_verified,
             categories.name as category_name, farmer_profiles.rating as farmer_rating,
             (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = products.id AND pi.is_primary = 1 ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1) AS image_url
             FROM products 
             JOIN users ON users.id = products.farmer_id 
             LEFT JOIN categories ON categories.id = products.category_id
             LEFT JOIN farmer_profiles ON farmer_profiles.user_id = products.farmer_id
             WHERE 1=1`;
  const params = [];
  if (q) { sql += ' AND (products.name LIKE ? OR users.name LIKE ? OR products.location LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (category) { sql += ' AND categories.name = ?'; params.push(category); }
  if (region) { sql += ' AND products.location = ?'; params.push(region); }
  if (minPrice) { sql += ' AND products.price >= ?'; params.push(Number(minPrice)); }
  if (maxPrice) { sql += ' AND products.price <= ?'; params.push(Number(maxPrice)); }
  if (organic === 'true') { sql += ' AND products.organic = 1'; }
  
  sql += ' AND products.status = ?';
  params.push((status || 'active').toUpperCase());
  
  // Sorting
  if (sort === 'price_asc') sql += ' ORDER BY products.price ASC';
  else if (sort === 'price_desc') sql += ' ORDER BY products.price DESC';
  else if (sort === 'rating') sql += ' ORDER BY farmer_profiles.rating DESC, products.created_at DESC';
  else sql += ' ORDER BY products.created_at DESC'; // default newest

  const rows = db.prepare(sql).all(...params);
  
  // map products back to listing format for backward compatibility
  const mapped = rows.map(r => ({
    ...r,
    category: r.category_name
  }));

  res.json({ listings: mapped });
});

router.get('/mine', requireAuth, requireRole('farmer'), (req, res) => {
  const rows = db.prepare(`SELECT p.*, p.name as crop_name, p.price as price_per_unit, c.name as category,
                            (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1) AS image_url
                            FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.farmer_id = ? ORDER BY p.created_at DESC`).all(req.user.id);
  res.json({ listings: rows });
});

router.get('/:id', (req, res) => {
  const row = db.prepare(`SELECT p.*, p.name as crop_name, p.price as price_per_unit, c.name as category,
                           u.name as farmer_name, u.phone as farmer_phone, u.region as farmer_region,
                           (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1) AS image_url
                           FROM products p 
                           JOIN users u ON u.id = p.farmer_id 
                           LEFT JOIN categories c ON c.id = p.category_id
                           WHERE p.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Product not found.' });
  res.json({ listing: row });
});

router.post('/', requireAuth, requireRole('farmer'), upload.single('icon'), (req, res) => {
  const { crop_name, category, quantity, unit, price_per_unit, organic, harvest_date, region, description, pickup_location, latitude, longitude } = req.body;
  if (!crop_name || !quantity || !unit || !price_per_unit || !region) {
    return res.status(400).json({ error: 'Crop, quantity, unit, price and region are required.' });
  }

  // Find or create category
  let catId = null;
  if (category) {
    let cat = db.prepare('SELECT id FROM categories WHERE lower(name) = ?').get(category.toLowerCase());
    if (!cat) {
      const info = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run(category, category.toLowerCase().replace(' ', '-'));
      catId = info.lastInsertRowid;
    } else {
      catId = cat.id;
    }
  }

  const numericQuantity = Number(quantity);
  const numericPrice = Number(price_per_unit);
  const safePickupLocation = pickup_location || region;

  const info = db.prepare(`INSERT INTO products
    (farmer_id, category_id, name, description, price, unit, quantity, available_quantity, harvest_date, location, organic, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`)
    .run(req.user.id, catId, crop_name, description || null, numericPrice, unit, numericQuantity, numericQuantity, harvest_date || null, safePickupLocation, organic ? 1 : 0);

  if (req.file) {
    const imageUrl = `/uploads/${req.file.filename}`;
    db.prepare('INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, 1, 0)').run(info.lastInsertRowid, imageUrl);
  }

  const listing = db.prepare(`SELECT p.*, p.name as crop_name, p.price as price_per_unit, c.name as category,
                              (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1) AS image_url
                              FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`).get(info.lastInsertRowid);
  res.status(201).json({ listing });
});

router.patch('/:id', requireAuth, requireRole('farmer'), upload.single('icon'), (req, res) => {
  const listing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Product not found.' });
  if (listing.farmer_id !== req.user.id) return res.status(403).json({ error: 'You can only edit your own products.' });

  const bodyMap = {
    crop_name: 'name',
    price_per_unit: 'price',
    region: 'location'
  };

  const updates = [];
  const params = [];
  for (const [reqField, val] of Object.entries(req.body)) {
    let dbField = bodyMap[reqField] || reqField;
    if (dbField === 'category') continue;
    if (reqField === 'pickup_location') {
      updates.push('location = ?');
      params.push(val || null);
      continue;
    }
    if (['name', 'price', 'unit', 'quantity', 'available_quantity', 'harvest_date', 'location', 'organic', 'status', 'description'].includes(dbField)) {
      updates.push(`${dbField} = ?`);
      if (dbField === 'status') params.push(val.toUpperCase());
      else params.push(val);
    }
  }

  if (req.file) {
    const imageUrl = `/uploads/${req.file.filename}`;
    const existing = db.prepare('SELECT * FROM product_images WHERE product_id = ? AND is_primary = 1 ORDER BY sort_order ASC, id ASC LIMIT 1').get(req.params.id);
    if (existing) {
      db.prepare('UPDATE product_images SET image_url = ?, sort_order = 0 WHERE id = ?').run(imageUrl, existing.id);
    } else {
      db.prepare('INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES (?, ?, 1, 0)').run(req.params.id, imageUrl);
    }
  }
  
  if (updates.length > 0) {
    params.push(req.params.id);
    db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  const updated = db.prepare(`SELECT p.*, p.name as crop_name, p.price as price_per_unit, c.name as category,
                              (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1) AS image_url
                              FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`).get(req.params.id);
  res.json({ listing: updated });
});

router.delete('/:id', requireAuth, requireRole('farmer'), (req, res) => {
  const listing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Product not found.' });
  if (listing.farmer_id !== req.user.id) return res.status(403).json({ error: 'You can only delete your own products.' });
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;

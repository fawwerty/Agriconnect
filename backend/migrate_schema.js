import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'agriconnect.sqlite');
const db = new Database(dbPath);

console.log('Starting safe database migration...');

db.pragma('foreign_keys = OFF');
db.exec('BEGIN TRANSACTION;');

try {
  // 1. Alter Users
  try { db.exec(`ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT NULL;`); } catch (_) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';`); } catch (_) {}
  try { db.exec('ALTER TABLE farmer_profiles ADD COLUMN pickup_address TEXT DEFAULT NULL;'); } catch (_) {}
  try { db.exec('ALTER TABLE transport_partners ADD COLUMN base_location TEXT DEFAULT NULL;'); } catch (_) {}

  // 2. Profiles
  db.exec(`
    CREATE TABLE IF NOT EXISTS farmer_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
      farm_name TEXT,
      farm_location TEXT,
      latitude REAL,
      longitude REAL,
      district TEXT,
      region TEXT,
      farm_size TEXT,
      verification_status TEXT DEFAULT 'pending',
      rating REAL DEFAULT 0,
      total_sales REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    
    CREATE TABLE IF NOT EXISTS buyer_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
      business_name TEXT,
      business_type TEXT,
      location TEXT,
      region TEXT,
      registration_number TEXT,
      verification_status TEXT DEFAULT 'pending',
      rating REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Migrate existing data into profiles
  db.exec(`
    INSERT OR IGNORE INTO farmer_profiles (user_id, region, verification_status)
    SELECT id, region, CASE WHEN verified=1 THEN 'approved' ELSE 'pending' END FROM users WHERE role='farmer';

    INSERT OR IGNORE INTO buyer_profiles (user_id, business_name, region, verification_status)
    SELECT id, business_name, region, CASE WHEN verified=1 THEN 'approved' ELSE 'pending' END FROM users WHERE role='buyer';
  `);

  // 3. Categories
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image_url TEXT
    );
  `);
  
  // Seed categories
  db.exec(`
    INSERT OR IGNORE INTO categories (name, slug) VALUES 
      ('Vegetables', 'vegetables'),
      ('Fruits', 'fruits'),
      ('Tubers', 'tubers'),
      ('Grains', 'grains'),
      ('Roots', 'roots'),
      ('Livestock', 'livestock'),
      ('Poultry', 'poultry'),
      ('Cash Crops', 'cash-crops');
  `);

  // 4. Products (replaces listings)
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER NOT NULL REFERENCES users(id),
      category_id INTEGER REFERENCES categories(id),
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      unit TEXT NOT NULL,
      quantity REAL NOT NULL,
      available_quantity REAL NOT NULL,
      minimum_order REAL DEFAULT 1,
      harvest_date TEXT,
      location TEXT,
      organic INTEGER DEFAULT 0,
      status TEXT DEFAULT 'ACTIVE',
      featured INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id),
      image_url TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0
    );
  `);

  // Migrate listings -> products
  const hasListings = db.prepare("SELECT count(*) as c FROM sqlite_master WHERE type='table' AND name='listings'").get().c > 0;
  if (hasListings) {
    db.exec(`
      INSERT INTO products (id, farmer_id, category_id, name, description, price, unit, quantity, available_quantity, harvest_date, location, organic, status, created_at)
      SELECT 
        l.id, l.farmer_id, c.id, l.crop_name, l.description, l.price_per_unit, l.unit, l.quantity, l.quantity, l.harvest_date, l.region, l.organic, UPPER(l.status), l.created_at
      FROM listings l
      LEFT JOIN categories c ON LOWER(c.name) = LOWER(l.category)
      WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.id = l.id);
    `);
  }

  // 5. Orders (swapping table to remove old check constraint and add columns)
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buyer_id INTEGER NOT NULL REFERENCES users(id),
      farmer_id INTEGER NOT NULL REFERENCES users(id),
      order_number TEXT UNIQUE,
      subtotal REAL NOT NULL,
      delivery_fee REAL DEFAULT 0,
      platform_fee REAL DEFAULT 0,
      commission REAL DEFAULT 0,
      total REAL NOT NULL,
      payment_status TEXT DEFAULT 'PENDING',
      order_status TEXT DEFAULT 'PENDING_PAYMENT',
      payment_method TEXT,
      payment_reference TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const hasOrders = db.prepare("SELECT count(*) as c FROM sqlite_master WHERE type='table' AND name='orders'").get().c > 0;
  if (hasOrders) {
    db.exec(`
      INSERT INTO orders_new (id, buyer_id, farmer_id, order_number, subtotal, commission, total, payment_status, order_status, payment_method, payment_reference, created_at, updated_at)
      SELECT 
        id, buyer_id, farmer_id, 'ORD-' || printf('%06d', id), subtotal, commission, total_to_buyer, 
        CASE WHEN payment_reference IS NOT NULL THEN 'SUCCESS' ELSE 'PENDING' END,
        CASE status 
          WHEN 'pending' THEN 'PENDING_PAYMENT'
          WHEN 'accepted' THEN 'ACCEPTED'
          WHEN 'escrow_held' THEN 'PAID'
          WHEN 'fulfilled' THEN 'DELIVERED'
          WHEN 'completed' THEN 'COMPLETED'
          WHEN 'cancelled' THEN 'CANCELLED'
          WHEN 'rejected' THEN 'CANCELLED'
          ELSE 'PENDING_PAYMENT'
        END,
        payment_method, payment_reference, created_at, updated_at
      FROM orders
      WHERE NOT EXISTS (SELECT 1 FROM orders_new WHERE orders_new.id = orders.id);
    `);
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL REFERENCES orders_new(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL
      );
    `);

    db.exec(`
      INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
      SELECT id, listing_id, quantity, unit_price, subtotal FROM orders
      WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE order_items.order_id = orders.id);
    `);

    // Safely drop dependent tables or rename them if necessary
    // Because transport_bookings and messages depend on orders(id), we should temporarily drop them and re-create them or just rely on PRAGMA foreign_keys = OFF allowing this swap.
    
    db.exec(`DROP TABLE orders;`);
    db.exec(`ALTER TABLE orders_new RENAME TO orders;`);
  }

  // 6. Payments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      buyer_id INTEGER NOT NULL REFERENCES users(id),
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'GHS',
      payment_method TEXT,
      provider TEXT,
      provider_transaction_id TEXT,
      payment_reference TEXT UNIQUE,
      status TEXT DEFAULT 'PENDING',
      phone TEXT,
      failure_reason TEXT,
      metadata TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);
  `);

  // 7. Reviews
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reviewer_id INTEGER NOT NULL REFERENCES users(id),
      target_id INTEGER NOT NULL REFERENCES users(id),
      order_id INTEGER REFERENCES orders(id),
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec('COMMIT;');
  console.log('Migration successful.');
} catch (e) {
  db.exec('ROLLBACK;');
  console.error('Migration failed:', e);
} finally {
  db.pragma('foreign_keys = ON');
}

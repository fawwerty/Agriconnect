import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/overview', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  const totalFarmers = db.prepare("SELECT COUNT(*) c FROM users WHERE role='farmer'").get().c;
  const totalBuyers = db.prepare("SELECT COUNT(*) c FROM users WHERE role='buyer'").get().c;
  const totalListings = db.prepare("SELECT COUNT(*) c FROM products WHERE status='ACTIVE'").get().c;
  const totalOrders = db.prepare('SELECT COUNT(*) c FROM orders').get().c;
  const completedOrders = db.prepare("SELECT COUNT(*) c FROM orders WHERE order_status='COMPLETED'").get().c;
  const commissionRevenue = db.prepare("SELECT COALESCE(SUM(commission),0) s FROM orders WHERE payment_status='SUCCESS'").get().s;
  const gmv = db.prepare("SELECT COALESCE(SUM(subtotal),0) s FROM orders WHERE payment_status='SUCCESS'").get().s;
  const pendingVerification = db.prepare('SELECT COUNT(*) c FROM users WHERE verified = 0').get().c;

  res.json({
    totalUsers, totalFarmers, totalBuyers, totalListings, totalOrders,
    completedOrders, commissionRevenue, gmv, pendingVerification,
  });
});

router.get('/orders-timeseries', (req, res) => {
  const rows = db.prepare(`SELECT date(created_at) as day, COUNT(*) as orders, COALESCE(SUM(subtotal),0) as gmv
    FROM orders GROUP BY date(created_at) ORDER BY day ASC`).all();
  res.json({ series: rows });
});

router.get('/revenue-by-crop', (req, res) => {
  const rows = db.prepare(`SELECT products.name as crop, COALESCE(SUM(order_items.subtotal),0) as revenue, COUNT(orders.id) as orders
    FROM orders 
    JOIN order_items ON order_items.order_id = orders.id
    JOIN products ON products.id = order_items.product_id
    GROUP BY products.name ORDER BY revenue DESC`).all();
  res.json({ rows });
});

router.get('/users', (req, res) => {
  const rows = db.prepare('SELECT id, name, email, role, phone, region, business_name, verified, created_at FROM users ORDER BY created_at DESC').all();
  res.json({ users: rows });
});

router.patch('/users/:id/verify', (req, res) => {
  const { verified } = req.body;
  db.prepare('UPDATE users SET verified = ? WHERE id = ?').run(verified ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

router.get('/listings', (req, res) => {
  const rows = db.prepare(`SELECT products.*, products.name as crop_name, products.price as price_per_unit, users.name as farmer_name FROM products
    JOIN users ON users.id = products.farmer_id ORDER BY products.created_at DESC`).all();
  res.json({ listings: rows });
});

router.get('/orders', (req, res) => {
  const rows = db.prepare(`SELECT orders.*, oi.product_id as listing_id, p.name as crop_name, 
      buyer.name as buyer_name, farmer.name as farmer_name
    FROM orders
    JOIN order_items oi ON oi.order_id = orders.id
    JOIN products p ON p.id = oi.product_id
    JOIN users buyer ON buyer.id = orders.buyer_id
    JOIN users farmer ON farmer.id = orders.farmer_id
    ORDER BY orders.created_at DESC`).all();
    
  const mapped = rows.map(r => {
    r.status = r.order_status === 'PENDING_PAYMENT' ? 'pending' : r.order_status.toLowerCase();
    r.total_to_buyer = r.total;
    r.payout_to_farmer = r.subtotal;
    return r;
  });
  
  res.json({ orders: mapped });
});

export default router;

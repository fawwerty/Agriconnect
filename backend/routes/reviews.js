import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// 1. Get reviews for a user (Farmer or Buyer)
router.get('/user/:userId', (req, res) => {
  const rows = db.prepare(`
    SELECT reviews.*, users.name as reviewer_name, users.role as reviewer_role
    FROM reviews
    JOIN users ON users.id = reviews.reviewer_id
    WHERE reviews.target_id = ?
    ORDER BY reviews.created_at DESC
  `).all(req.params.userId);

  const stats = db.prepare(`
    SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
    FROM reviews
    WHERE target_id = ?
  `).get(req.params.userId);

  res.json({
    reviews: rows,
    average_rating: stats.avg_rating ? +stats.avg_rating.toFixed(1) : 5.0,
    total_reviews: stats.total_reviews || 0
  });
});

// 2. Post a Review for an Order
router.post('/', requireAuth, (req, res) => {
  const { order_id, rating, comment } = req.body;
  if (!order_id || !rating) {
    return res.status(400).json({ error: 'Order ID and rating (1-5) are required.' });
  }

  const numRating = Number(rating);
  if (numRating < 1 || numRating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  if (order.buyer_id !== req.user.id && order.farmer_id !== req.user.id) {
    return res.status(403).json({ error: 'You were not a party in this order.' });
  }

  // Target is the other party in the order
  const targetId = req.user.id === order.buyer_id ? order.farmer_id : order.buyer_id;

  // Check if review already submitted
  const existing = db.prepare('SELECT id FROM reviews WHERE order_id = ? AND reviewer_id = ?').get(order_id, req.user.id);
  if (existing) {
    return res.status(409).json({ error: 'You have already submitted a review for this transaction.' });
  }

  try {
    db.exec('BEGIN TRANSACTION');

    const info = db.prepare(`
      INSERT INTO reviews (reviewer_id, target_id, order_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, targetId, order_id, numRating, comment || null);

    // Update target rating in farmer_profiles or buyer_profiles
    const targetUser = db.prepare('SELECT role FROM users WHERE id = ?').get(targetId);
    const avgObj = db.prepare('SELECT AVG(rating) as avg_rating FROM reviews WHERE target_id = ?').get(targetId);
    const newAvg = avgObj.avg_rating ? +avgObj.avg_rating.toFixed(2) : numRating;

    if (targetUser.role === 'farmer') {
      db.prepare('UPDATE farmer_profiles SET rating = ? WHERE user_id = ?').run(newAvg, targetId);
    } else if (targetUser.role === 'buyer') {
      db.prepare('UPDATE buyer_profiles SET rating = ? WHERE user_id = ?').run(newAvg, targetId);
    }

    db.exec('COMMIT');

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ success: true, review });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to save review.' });
  }
});

export default router;

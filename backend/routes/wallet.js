import { Router } from 'express';
import crypto from 'crypto';
import db from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

function notify(userId, message) {
  try {
    db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(userId, message);
  } catch (err) {
    console.error('Notification error:', err);
  }
}

// 1. Get Wallet Balance and Cashout Ledger
router.get('/', requireAuth, (req, res) => {
  // Total earned from completed orders
  const earnedResult = db.prepare(`
    SELECT COALESCE(SUM(subtotal), 0) as total_earned
    FROM orders
    WHERE farmer_id = ? AND order_status = 'COMPLETED'
  `).get(req.user.id);

  // Total cashed out
  const cashedOutResult = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total_cashed_out
    FROM wallet_transactions
    WHERE user_id = ? AND type = 'debit_cashout' AND status = 'COMPLETED'
  `).get(req.user.id);

  // Pending escrow in active orders
  const pendingEscrowResult = db.prepare(`
    SELECT COALESCE(SUM(subtotal), 0) as pending_escrow
    FROM orders
    WHERE farmer_id = ? AND order_status IN ('PAID', 'PREPARING', 'DELIVERED')
  `).get(req.user.id);

  const totalEarned = earnedResult.total_earned;
  const totalCashedOut = cashedOutResult.total_cashed_out;
  const availableBalance = Math.max(0, +(totalEarned - totalCashedOut).toFixed(2));
  const pendingEscrow = +pendingEscrowResult.pending_escrow.toFixed(2);

  // Recent transactions
  const transactions = db.prepare(`
    SELECT * FROM wallet_transactions
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(req.user.id);

  res.json({
    available_balance: availableBalance,
    pending_escrow: pendingEscrow,
    total_lifetime_earnings: totalEarned,
    total_cashed_out: totalCashedOut,
    currency: 'GHS',
    transactions
  });
});

// 2. Request Mobile Money / Bank Cashout
router.post('/cashout', requireAuth, (req, res) => {
  const { amount, channel, destination_account, account_name } = req.body;
  if (!amount || !channel || !destination_account) {
    return res.status(400).json({ error: 'Amount, channel, and destination account (phone/bank) are required.' });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < 10) {
    return res.status(400).json({ error: 'Minimum cashout amount is GHS 10.00' });
  }

  // Calculate current available balance
  const earned = db.prepare(`SELECT COALESCE(SUM(subtotal), 0) as s FROM orders WHERE farmer_id = ? AND order_status = 'COMPLETED'`).get(req.user.id).s;
  const cashedOut = db.prepare(`SELECT COALESCE(SUM(amount), 0) as s FROM wallet_transactions WHERE user_id = ? AND type = 'debit_cashout' AND status = 'COMPLETED'`).get(req.user.id).s;
  const available = Math.max(0, +(earned - cashedOut).toFixed(2));

  if (numAmount > available) {
    return res.status(400).json({ error: `Insufficient available wallet balance. Available: GHS ${available.toFixed(2)}` });
  }

  // 1% Ghana MoMo cashout processing fee (capped at GHS 10)
  const fee = Math.min(10, +(numAmount * 0.01).toFixed(2));
  const netAmount = +(numAmount - fee).toFixed(2);

  const ref = `AGC-CASHOUT-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  try {
    db.prepare(`
      INSERT INTO wallet_transactions
      (user_id, type, amount, fee, net_amount, channel, destination_account, reference, status)
      VALUES (?, 'debit_cashout', ?, ?, ?, ?, ?, ?, 'COMPLETED')
    `).run(req.user.id, numAmount, fee, netAmount, channel, destination_account, ref);

    notify(req.user.id, `Cashout of GHS ${netAmount.toFixed(2)} sent to your ${channel} (${destination_account}). Ref: ${ref}`);

    res.status(201).json({
      success: true,
      reference: ref,
      amount: numAmount,
      fee,
      net_amount: netAmount,
      channel,
      destination_account,
      message: `Cashout processed successfully. GHS ${netAmount.toFixed(2)} dispatched to ${destination_account} via ${channel}.`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Cashout transaction failed.' });
  }
});

export default router;

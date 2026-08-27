import jwt from 'jsonwebtoken';
import db from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'agriconnect-dev-secret-change-me';

export function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is active in DB to allow instant revocation
    const user = db.prepare('SELECT status FROM users WHERE id = ?').get(decoded.id);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Account suspended or inactive.' });
    }
    
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have access to this action.' });
    }
    next();
  };
}

export { JWT_SECRET };

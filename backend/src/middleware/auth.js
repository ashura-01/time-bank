import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await pool.query(
      'SELECT id, email, first_name, last_name, role, time_balance, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!users.length || !users[0].is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    next(error);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await pool.query(
      'SELECT id, email, first_name, last_name, role, time_balance, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length && users[0].is_active) {
      req.user = users[0];
    }
    next();
  } catch (error) {
    next();
  }
};
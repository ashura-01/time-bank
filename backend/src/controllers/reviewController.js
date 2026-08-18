import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';

export const createReview = async (req, res, next) => {
  try {
    const { transaction_id, rating, comment } = req.body;
    const reviewer_id = req.user.id;

    const [transactions] = await pool.query('SELECT * FROM transactions WHERE id = ?', [transaction_id]);
    if (!transactions.length) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactions[0];
    if (transaction.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed transactions' });
    }

    if (transaction.requester_id !== reviewer_id && transaction.provider_id !== reviewer_id) {
      return res.status(403).json({ error: 'Not part of this transaction' });
    }

    const reviewee_id = transaction.requester_id === reviewer_id ? transaction.provider_id : transaction.requester_id;

    const [existing] = await pool.query(
      'SELECT id FROM reviews WHERE transaction_id = ? AND reviewer_id = ?',
      [transaction_id, reviewer_id]
    );
    if (existing.length) {
      return res.status(409).json({ error: 'Already reviewed this transaction' });
    }

    const id = uuidv4();
    await pool.query(
      `INSERT INTO reviews (id, transaction_id, reviewer_id, reviewee_id, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, transaction_id, reviewer_id, reviewee_id, rating, comment || null]
    );

    // Update reviewee's average rating (could be a computed field or separate table)
    const [reviews] = await pool.query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE reviewee_id = ?',
      [reviewee_id]
    );

    await pool.query(
      'UPDATE users SET avg_rating = ?, review_count = ? WHERE id = ?',
      [reviews[0].avg_rating || 0, reviews[0].review_count, reviewee_id]
    );

    const [review] = await pool.query(
      `SELECT r.*, u.first_name as reviewer_first, u.last_name as reviewer_last, u.avatar_url as reviewer_avatar
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.id = ?`,
      [id]
    );

    res.status(201).json({ review: review[0] });
  } catch (error) {
    next(error);
  }
};

export const getReviews = async (req, res, next) => {
  try {
    const { reviewee_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];

    if (reviewee_id) {
      whereClause = 'WHERE r.reviewee_id = ?';
      params.push(reviewee_id);
    }

    const [reviews] = await pool.query(
      `SELECT r.*, u.first_name as reviewer_first, u.last_name as reviewer_last, u.avatar_url as reviewer_avatar,
              s.title as service_title
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       JOIN transactions t ON r.transaction_id = t.id
       JOIN services s ON t.service_id = s.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM reviews r ${whereClause}`,
      params
    );

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [reviews] = await pool.query(
      `SELECT r.*, u.first_name as reviewer_first, u.last_name as reviewer_last, u.avatar_url as reviewer_avatar,
              s.title as service_title
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       JOIN transactions t ON r.transaction_id = t.id
       JOIN services s ON t.service_id = s.id
       WHERE r.id = ?`,
      [id]
    );

    if (!reviews.length) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ review: reviews[0] });
  } catch (error) {
    next(error);
  }
};
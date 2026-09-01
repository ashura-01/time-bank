import pool from '../config/db.js';

export const reviewRepository = {
  async findExistingReview(transactionId, reviewerId) {
    const [existing] = await pool.query(
      'SELECT id FROM reviews WHERE transaction_id = ? AND reviewer_id = ?',
      [transactionId, reviewerId]
    );
    return existing[0] || null;
  },

  async createReview({ id, transactionId, reviewerId, revieweeId, rating, comment }) {
    await pool.query(
      `INSERT INTO reviews (id, transaction_id, reviewer_id, reviewee_id, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, transactionId, reviewerId, revieweeId, rating, comment || null]
    );

    return this.findReviewById(id);
  },

  async findReviews({ revieweeId, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    let whereClause = '';
    const params = [];

    if (revieweeId) {
      whereClause = 'WHERE r.reviewee_id = ?';
      params.push(revieweeId);
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

    return {
      reviews,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    };
  },

  async findReviewById(id) {
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
    return reviews[0] || null;
  }
};

export default reviewRepository;

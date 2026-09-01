import pool from '../config/db.js';

export const disputeRepository = {
  async findActiveDisputeForTransaction(transactionId, connection) {
    const db = connection || pool;
    const [existing] = await db.query(
      "SELECT id FROM disputes WHERE transaction_id = ? AND status != 'rejected'",
      [transactionId]
    );
    return existing[0] || null;
  },

  async createDispute(connection, { id, transactionId, raisedBy, reason, evidence }) {
    const db = connection || pool;
    await db.query(
      `INSERT INTO disputes (id, transaction_id, raised_by, reason, evidence, status)
       VALUES (?, ?, ?, ?, ?, 'open')`,
      [id, transactionId, raisedBy, reason, evidence || null]
    );

    await db.query("UPDATE transactions SET status = 'disputed', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [transactionId]);

    const [dispute] = await db.query(
      `SELECT d.*, t.service_id, s.title as service_title,
              t.requester_id, t.provider_id,
              u.first_name as raised_first, u.last_name as raised_last
       FROM disputes d
       JOIN transactions t ON d.transaction_id = t.id
       JOIN services s ON t.service_id = s.id
       JOIN users u ON d.raised_by = u.id
       WHERE d.id = ?`,
      [id]
    );

    return dispute[0] || null;
  },

  async findDisputes({ userId, isAdmin = false, status, page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;
    let whereClause = '';
    const params = [];

    if (isAdmin) {
      whereClause = 'WHERE 1=1';
    } else {
      whereClause = 'WHERE (d.raised_by = ? OR t.requester_id = ? OR t.provider_id = ?)';
      params.push(userId, userId, userId);
    }

    if (status) {
      whereClause += (whereClause ? ' AND ' : ' WHERE ') + 'd.status = ?';
      params.push(status);
    }

    const [disputes] = await pool.query(
      `SELECT d.*, t.service_id, s.title as service_title,
              t.requester_id, t.provider_id,
              u1.first_name as raised_first, u1.last_name as raised_last,
              u2.first_name as requester_first, u2.last_name as requester_last,
              u3.first_name as provider_first, u3.last_name as provider_last,
              u4.first_name as resolved_first, u4.last_name as resolved_last
       FROM disputes d
       JOIN transactions t ON d.transaction_id = t.id
       JOIN services s ON t.service_id = s.id
       JOIN users u1 ON d.raised_by = u1.id
       JOIN users u2 ON t.requester_id = u2.id
       JOIN users u3 ON t.provider_id = u3.id
       LEFT JOIN users u4 ON d.resolved_by = u4.id
       ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM disputes d
       JOIN transactions t ON d.transaction_id = t.id
       ${whereClause}`,
      params
    );

    return {
      disputes,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1
    };
  },

  async findDisputeById(id) {
    const [disputes] = await pool.query(
      `SELECT d.*, t.service_id, s.title as service_title, t.hours_exchanged, t.status as transaction_status,
              t.requester_id, t.provider_id,
              u1.first_name as raised_first, u1.last_name as raised_last, u1.email as raised_email,
              u2.first_name as requester_first, u2.last_name as requester_last, u2.email as requester_email,
              u3.first_name as provider_first, u3.last_name as provider_last, u3.email as provider_email,
              u4.first_name as resolved_first, u4.last_name as resolved_last
       FROM disputes d
       JOIN transactions t ON d.transaction_id = t.id
       JOIN services s ON t.service_id = s.id
       JOIN users u1 ON d.raised_by = u1.id
       JOIN users u2 ON t.requester_id = u2.id
       JOIN users u3 ON t.provider_id = u3.id
       LEFT JOIN users u4 ON d.resolved_by = u4.id
       WHERE d.id = ?`,
      [id]
    );
    return disputes[0] || null;
  },

  async findRawDisputeById(connection, id) {
    const db = connection || pool;
    const [disputes] = await db.query('SELECT * FROM disputes WHERE id = ?', [id]);
    return disputes[0] || null;
  },

  async resolveDispute(connection, { id, resolution, status, adminUserId, transactionId }) {
    await connection.query(
      `UPDATE disputes SET resolution = ?, status = ?, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [resolution, status, adminUserId, id]
    );

    if (status === 'resolved') {
      const [transactions] = await connection.query('SELECT * FROM transactions WHERE id = ?', [transactionId]);
      if (transactions.length) {
        await connection.query("UPDATE transactions SET status = 'completed', completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE id = ?", [transactionId]);
      }
    }

    const [updated] = await connection.query(
      `SELECT d.*, t.service_id, s.title as service_title,
              t.requester_id, t.provider_id,
              u.first_name as resolved_first, u.last_name as resolved_last
       FROM disputes d
       JOIN transactions t ON d.transaction_id = t.id
       JOIN services s ON t.service_id = s.id
       LEFT JOIN users u ON d.resolved_by = u.id
       WHERE d.id = ?`,
      [id]
    );

    return updated[0] || null;
  }
};

export default disputeRepository;

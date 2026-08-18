import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';

export const createDispute = async (req, res, next) => {
  try {
    const { transaction_id, reason, evidence } = req.body;
    const raised_by = req.user.id;

    const [transactions] = await pool.query('SELECT * FROM transactions WHERE id = ?', [transaction_id]);
    if (!transactions.length) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactions[0];
    if (transaction.requester_id !== raised_by && transaction.provider_id !== raised_by) {
      return res.status(403).json({ error: 'Not part of this transaction' });
    }

    if (transaction.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot dispute cancelled transaction' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM disputes WHERE transaction_id = ? AND status != "rejected"',
      [transaction_id]
    );
    if (existing.length) {
      return res.status(409).json({ error: 'Dispute already exists for this transaction' });
    }

    const id = uuidv4();
    await pool.query(
      `INSERT INTO disputes (id, transaction_id, raised_by, reason, evidence, status)
       VALUES (?, ?, ?, ?, ?, 'open')`,
      [id, transaction_id, raised_by, reason, evidence || null]
    );

    // Update transaction status to disputed
    await pool.query('UPDATE transactions SET status = "disputed" WHERE id = ?', [transaction_id]);

    const [dispute] = await pool.query(
      `SELECT d.*, u.first_name as raised_first, u.last_name as raised_last
       FROM disputes d
       JOIN users u ON d.raised_by = u.id
       WHERE d.id = ?`,
      [id]
    );

    res.status(201).json({ dispute: dispute[0] });
  } catch (error) {
    next(error);
  }
};

export const getDisputes = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let whereClause = '';
    const params = [];

    if (isAdmin) {
      whereClause = 'WHERE 1=1';
    } else {
      whereClause = 'WHERE d.raised_by = ? OR t.requester_id = ? OR t.provider_id = ?';
      params.push(userId, userId, userId);
    }

    if (status) {
      whereClause += (whereClause ? ' AND ' : ' WHERE ') + 'd.status = ?';
      params.push(status);
    }

    const [disputes] = await pool.query(
      `SELECT d.*, t.service_id, s.title as service_title,
              u1.first_name as raised_first, u1.last_name as raised_last,
              u2.first_name as requester_first, u2.last_name as requester_last,
              u3.first_name as provider_first, u3.last_name as provider_last
       FROM disputes d
       JOIN transactions t ON d.transaction_id = t.id
       JOIN services s ON t.service_id = s.id
       JOIN users u1 ON d.raised_by = u1.id
       JOIN users u2 ON t.requester_id = u2.id
       JOIN users u3 ON t.provider_id = u3.id
       ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM disputes d
       JOIN transactions t ON d.transaction_id = t.id
       ${whereClause}`,
      params
    );

    res.json({
      disputes,
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

export const getDisputeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const [disputes] = await pool.query(
      `SELECT d.*, t.service_id, s.title as service_title, t.hours_exchanged, t.status as transaction_status,
              u1.first_name as raised_first, u1.last_name as raised_last, u1.email as raised_email,
              u2.first_name as requester_first, u2.last_name as requester_last, u2.email as requester_email,
              u3.first_name as provider_first, u3.last_name as provider_last, u3.email as provider_email
       FROM disputes d
       JOIN transactions t ON d.transaction_id = t.id
       JOIN services s ON t.service_id = s.id
       JOIN users u1 ON d.raised_by = u1.id
       JOIN users u2 ON t.requester_id = u2.id
       JOIN users u3 ON t.provider_id = u3.id
       WHERE d.id = ?`,
      [id]
    );

    if (!disputes.length) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    const dispute = disputes[0];

    if (!isAdmin && dispute.raised_by !== userId && dispute.requester_id !== userId && dispute.provider_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to view this dispute' });
    }

    res.json({ dispute });
  } catch (error) {
    next(error);
  }
};

export const resolveDispute = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { resolution, status } = req.body;
    const userId = req.user.id;

    if (req.user.role !== 'admin') {
      await connection.rollback();
      return res.status(403).json({ error: 'Admin only' });
    }

    const [disputes] = await connection.query('SELECT * FROM disputes WHERE id = ?', [id]);
    if (!disputes.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Dispute not found' });
    }

    const dispute = disputes[0];

    await connection.query(
      `UPDATE disputes SET resolution = ?, status = ?, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [resolution, status, userId, id]
    );

    // If resolved, potentially reverse the transaction or adjust balances
    if (status === 'resolved') {
      const [transactions] = await connection.query('SELECT * FROM transactions WHERE id = ?', [dispute.transaction_id]);
      if (transactions.length) {
        const transaction = transactions[0];
        // Optionally reverse the time exchange here based on resolution
        // For now, just update transaction status
        await connection.query('UPDATE transactions SET status = "completed" WHERE id = ?', [dispute.transaction_id]);
      }
    }

    await connection.commit();

    const [updated] = await connection.query(
      `SELECT d.*, u.first_name as resolved_first, u.last_name as resolved_last
       FROM disputes d
       LEFT JOIN users u ON d.resolved_by = u.id
       WHERE d.id = ?`,
      [id]
    );

    res.json({ dispute: updated[0] });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};
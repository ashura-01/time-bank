import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';

export const transactionRepository = {
  async createLedgerEntry(connection, transactionId, userId, entryType, hours, balanceAfter, description) {
    const id = uuidv4();
    await connection.query(
      `INSERT INTO ledger_entries (id, transaction_id, user_id, entry_type, hours, balance_after, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, transactionId, userId, entryType, hours, balanceAfter, description]
    );
    return id;
  },

  async createTransaction(connection, { id, serviceId, requesterId, providerId, hoursExchanged, scheduledAt, location, isRemote }) {
    await connection.query(
      `INSERT INTO transactions (id, service_id, requester_id, provider_id, hours_exchanged, scheduled_at, location, is_remote, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [id, serviceId, requesterId, providerId, hoursExchanged, scheduledAt || null, location || null, isRemote || false]
    );
  },

  async findTransactions({ userId, status, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE (t.requester_id = ? OR t.provider_id = ?)';
    const params = [userId, userId];

    if (status) {
      whereClause += ' AND t.status = ?';
      params.push(status);
    }

    const [transactions] = await pool.query(
      `SELECT t.*, s.title as service_title, s.type as service_type,
              u1.first_name as requester_first, u1.last_name as requester_last,
              u2.first_name as provider_first, u2.last_name as provider_last
       FROM transactions t
       JOIN services s ON t.service_id = s.id
       JOIN users u1 ON t.requester_id = u1.id
       JOIN users u2 ON t.provider_id = u2.id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM transactions t ${whereClause}`,
      params
    );

    return {
      transactions,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    };
  },

  async findTransactionById(id, userId) {
    let whereClause = 'WHERE t.id = ?';
    const params = [id];

    if (userId) {
      whereClause += ' AND (t.requester_id = ? OR t.provider_id = ?)';
      params.push(userId, userId);
    }

    const [transactions] = await pool.query(
      `SELECT t.*, s.title as service_title, s.description as service_description, s.type as service_type,
              u1.first_name as requester_first, u1.last_name as requester_last, u1.email as requester_email,
              u2.first_name as provider_first, u2.last_name as provider_last, u2.email as provider_email
       FROM transactions t
       JOIN services s ON t.service_id = s.id
       JOIN users u1 ON t.requester_id = u1.id
       JOIN users u2 ON t.provider_id = u2.id
       ${whereClause}`,
      params
    );

    if (!transactions.length) return null;

    const [ledger] = await pool.query(
      `SELECT * FROM ledger_entries WHERE transaction_id = ? ORDER BY created_at`,
      [id]
    );
    transactions[0].ledger_entries = ledger;

    return transactions[0];
  },

  async findRawTransactionById(connection, id) {
    const db = connection || pool;
    const [transactions] = await db.query('SELECT * FROM transactions WHERE id = ?', [id]);
    return transactions[0] || null;
  },

  async updateStatusWithCAS(connection, id, status, fromStatus, extraFields = {}) {
    const fields = ['status = ?'];
    const values = [status];

    if (extraFields.scheduled_at !== undefined) { fields.push('scheduled_at = ?'); values.push(extraFields.scheduled_at); }
    if (extraFields.location !== undefined) { fields.push('location = ?'); values.push(extraFields.location); }
    if (extraFields.is_remote !== undefined) { fields.push('is_remote = ?'); values.push(extraFields.is_remote); }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, fromStatus);

    const [updateResult] = await connection.query(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = ? AND status = ?`,
      values
    );

    return updateResult.affectedRows > 0;
  },

  async markCompletionParty(connection, id, column) {
    const [markResult] = await connection.query(
      `UPDATE transactions SET ${column} = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'confirmed' AND ${column} IS NULL`,
      [id]
    );
    return markResult.affectedRows > 0;
  },

  async holdBalance(connection, userId, hours) {
    const [result] = await connection.query(
      'UPDATE users SET time_balance = time_balance - ?, held_balance = held_balance + ? WHERE id = ? AND time_balance >= ?',
      [hours, hours, userId, hours]
    );
    return result.affectedRows > 0;
  },

  async releaseHeldBalance(connection, userId, hours) {
    const [result] = await connection.query(
      'UPDATE users SET time_balance = time_balance + ?, held_balance = held_balance - ? WHERE id = ? AND held_balance >= ?',
      [hours, hours, userId, hours]
    );
    return result.affectedRows > 0;
  },

  async finalizeSettlement(connection, { transactionId, serviceId, payerId, payeeId, hours, isOffer }) {
    const [finalizeResult] = await connection.query(
      `UPDATE transactions SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'confirmed'`,
      [transactionId]
    );
    if (finalizeResult.affectedRows === 0) {
      return { success: false, reason: 'concurrency_conflict' };
    }

    if (isOffer) {
      // For offer services, payer's funds were moved to held_balance at booking time
      const [debitHeld] = await connection.query(
        'UPDATE users SET held_balance = held_balance - ? WHERE id = ? AND held_balance >= ?',
        [hours, payerId, hours]
      );
      if (debitHeld.affectedRows === 0) {
        return { success: false, reason: 'insufficient_funds' };
      }
    } else {
      // For request services, requester fulfills & pays directly from available time_balance at completion
      const [debitAvail] = await connection.query(
        'UPDATE users SET time_balance = time_balance - ? WHERE id = ? AND time_balance >= ?',
        [hours, payerId, hours]
      );
      if (debitAvail.affectedRows === 0) {
        return { success: false, reason: 'insufficient_funds' };
      }
    }

    await connection.query('UPDATE users SET time_balance = time_balance + ? WHERE id = ?', [hours, payeeId]);

    const [[payerRow]] = await connection.query('SELECT time_balance FROM users WHERE id = ?', [payerId]);
    const [[payeeRow]] = await connection.query('SELECT time_balance FROM users WHERE id = ?', [payeeId]);

    await this.createLedgerEntry(connection, transactionId, payerId, 'debit', hours, payerRow.time_balance,
      isOffer ? `Paid for service: ${serviceId}` : `Fulfilled request: ${serviceId}`);
    await this.createLedgerEntry(connection, transactionId, payeeId, 'credit', hours, payeeRow.time_balance,
      isOffer ? `Earned from service: ${serviceId}` : `Service fulfilled: ${serviceId}`);

    await connection.query(
      `UPDATE services SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [serviceId]
    );

    return { success: true };
  },

  async getLedgerEntries({ userId, page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;

    const [entries] = await pool.query(
      `SELECT le.*, t.service_id, s.title as service_title
       FROM ledger_entries le
       JOIN transactions t ON le.transaction_id = t.id
       JOIN services s ON t.service_id = s.id
       WHERE le.user_id = ?
       ORDER BY le.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM ledger_entries WHERE user_id = ?',
      [userId]
    );

    return {
      entries,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    };
  },

  async findAllTransactionsAdmin({ page = 1, limit = 20, status } = {}) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND t.status = ?';
      params.push(status);
    }

    const [transactions] = await pool.query(
      `SELECT t.*, s.title as service_title,
              u1.first_name as requester_first, u1.last_name as requester_last, u1.email as requester_email,
              u2.first_name as provider_first, u2.last_name as provider_last, u2.email as provider_email
       FROM transactions t
       JOIN services s ON t.service_id = s.id
       JOIN users u1 ON t.requester_id = u1.id
       JOIN users u2 ON t.provider_id = u2.id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM transactions t ${whereClause}`,
      params
    );

    return {
      transactions,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    };
  }
};

export default transactionRepository;

import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';

const createLedgerEntry = async (connection, transactionId, userId, entryType, hours, balanceAfter, description) => {
  const id = uuidv4();
  await connection.query(
    `INSERT INTO ledger_entries (id, transaction_id, user_id, entry_type, hours, balance_after, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, transactionId, userId, entryType, hours, balanceAfter, description]
  );
};

export const createTransaction = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { service_id, hours_exchanged, scheduled_at, location, is_remote } = req.body;
    const requester_id = req.user.id;

    const [services] = await connection.query('SELECT * FROM services WHERE id = ?', [service_id]);
    if (!services.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = services[0];
    if (service.provider_id === requester_id) {
      await connection.rollback();
      return res.status(400).json({ error: 'Cannot transact with your own service' });
    }

    if (service.status !== 'active') {
      await connection.rollback();
      return res.status(400).json({ error: 'Service not available' });
    }

    // Check requester has enough balance (for offers)
    if (service.type === 'offer') {
      const [requester] = await connection.query('SELECT time_balance FROM users WHERE id = ?', [requester_id]);
      if (requester[0].time_balance < hours_exchanged) {
        await connection.rollback();
        return res.status(400).json({ error: 'Insufficient time balance' });
      }
    }

    const transactionId = uuidv4();
    await connection.query(
      `INSERT INTO transactions (id, service_id, requester_id, provider_id, hours_exchanged, scheduled_at, location, is_remote, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [transactionId, service_id, requester_id, service.provider_id, hours_exchanged, scheduled_at || null, location || null, is_remote || false]
    );

    await connection.commit();

    const [transaction] = await connection.query(
      `SELECT t.*, s.title as service_title, s.type as service_type,
              u1.first_name as requester_first, u1.last_name as requester_last,
              u2.first_name as provider_first, u2.last_name as provider_last
       FROM transactions t
       JOIN services s ON t.service_id = s.id
       JOIN users u1 ON t.requester_id = u1.id
       JOIN users u2 ON t.provider_id = u2.id
       WHERE t.id = ?`,
      [transactionId]
    );

    res.status(201).json({ transaction: transaction[0] });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    let whereClause = 'WHERE t.requester_id = ? OR t.provider_id = ?';
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

    res.json({
      transactions,
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

export const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [transactions] = await pool.query(
      `SELECT t.*, s.title as service_title, s.description as service_description, s.type as service_type,
              u1.first_name as requester_first, u1.last_name as requester_last, u1.email as requester_email,
              u2.first_name as provider_first, u2.last_name as provider_last, u2.email as provider_email
       FROM transactions t
       JOIN services s ON t.service_id = s.id
       JOIN users u1 ON t.requester_id = u1.id
       JOIN users u2 ON t.provider_id = u2.id
       WHERE t.id = ? AND (t.requester_id = ? OR t.provider_id = ?)`,
      [id, userId, userId]
    );

    if (!transactions.length) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const [ledger] = await pool.query(
      `SELECT * FROM ledger_entries WHERE transaction_id = ? ORDER BY created_at`,
      [id]
    );
    transactions[0].ledger_entries = ledger;

    res.json({ transaction: transactions[0] });
  } catch (error) {
    next(error);
  }
};

export const updateTransactionStatus = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { status, scheduled_at, location, is_remote } = req.body;
    const userId = req.user.id;

    const [transactions] = await connection.query('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!transactions.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactions[0];

    // Only provider can confirm, both can cancel, only requester/provider can complete
    if (status === 'confirmed' && transaction.provider_id !== userId) {
      await connection.rollback();
      return res.status(403).json({ error: 'Only provider can confirm' });
    }
    if (status === 'completed') {
      if (transaction.requester_id !== userId && transaction.provider_id !== userId) {
        await connection.rollback();
        return res.status(403).json({ error: 'Not authorized' });
      }
      if (transaction.status !== 'confirmed') {
        await connection.rollback();
        return res.status(400).json({ error: 'Transaction must be confirmed first' });
      }
    }
    if (status === 'cancelled') {
      if (transaction.requester_id !== userId && transaction.provider_id !== userId && req.user.role !== 'admin') {
        await connection.rollback();
        return res.status(403).json({ error: 'Not authorized' });
      }
      if (transaction.status === 'completed') {
        await connection.rollback();
        return res.status(400).json({ error: 'Cannot cancel completed transaction' });
      }
    }

    const fields = ['status = ?'];
    const values = [status];

    if (scheduled_at !== undefined) { fields.push('scheduled_at = ?'); values.push(scheduled_at); }
    if (location !== undefined) { fields.push('location = ?'); values.push(location); }
    if (is_remote !== undefined) { fields.push('is_remote = ?'); values.push(is_remote); }
    if (status === 'completed') { fields.push('completed_at = CURRENT_TIMESTAMP'); }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await connection.query(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`, values);

    // If completed, process the time exchange via ledger
    if (status === 'completed') {
      const hours = transaction.hours_exchanged;
      const serviceType = 'offer'; // We'll get this from service

      const [service] = await connection.query('SELECT type FROM services WHERE id = ?', [transaction.service_id]);
      const isOffer = service[0].type === 'offer';

      if (isOffer) {
        // Requester pays hours, provider receives hours
        // Debit requester
        const [requester] = await connection.query('SELECT time_balance FROM users WHERE id = ?', [transaction.requester_id]);
        const requesterNewBalance = requester[0].time_balance - hours;
        await connection.query('UPDATE users SET time_balance = ? WHERE id = ?', [requesterNewBalance, transaction.requester_id]);
        await createLedgerEntry(connection, id, transaction.requester_id, 'debit', hours, requesterNewBalance, `Paid for service: ${transaction.service_id}`);

        // Credit provider
        const [provider] = await connection.query('SELECT time_balance FROM users WHERE id = ?', [transaction.provider_id]);
        const providerNewBalance = provider[0].time_balance + hours;
        await connection.query('UPDATE users SET time_balance = ? WHERE id = ?', [providerNewBalance, transaction.provider_id]);
        await createLedgerEntry(connection, id, transaction.provider_id, 'credit', hours, providerNewBalance, `Earned from service: ${transaction.service_id}`);
      } else {
        // For requests: provider fulfills request, requester receives hours (they posted the request)
        // This means provider earns hours, requester spends hours (they get the service done)
        const [requester] = await connection.query('SELECT time_balance FROM users WHERE id = ?', [transaction.requester_id]);
        const requesterNewBalance = requester[0].time_balance + hours;
        await connection.query('UPDATE users SET time_balance = ? WHERE id = ?', [requesterNewBalance, transaction.requester_id]);
        await createLedgerEntry(connection, id, transaction.requester_id, 'credit', hours, requesterNewBalance, `Service fulfilled: ${transaction.service_id}`);

        const [provider] = await connection.query('SELECT time_balance FROM users WHERE id = ?', [transaction.provider_id]);
        const providerNewBalance = provider[0].time_balance - hours;
        await connection.query('UPDATE users SET time_balance = ? WHERE id = ?', [providerNewBalance, transaction.provider_id]);
        await createLedgerEntry(connection, id, transaction.provider_id, 'debit', hours, providerNewBalance, `Fulfilled request: ${transaction.service_id}`);
      }
    }

    await connection.commit();

    const [updated] = await connection.query(
      `SELECT t.*, s.title as service_title, s.type as service_type,
              u1.first_name as requester_first, u1.last_name as requester_last,
              u2.first_name as provider_first, u2.last_name as provider_last
       FROM transactions t
       JOIN services s ON t.service_id = s.id
       JOIN users u1 ON t.requester_id = u1.id
       JOIN users u2 ON t.provider_id = u2.id
       WHERE t.id = ?`,
      [id]
    );

    res.json({ transaction: updated[0] });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

export const getLedger = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

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

    res.json({
      entries,
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
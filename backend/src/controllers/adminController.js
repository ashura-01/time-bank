import pool from '../config/db.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const [[users]] = await pool.query("SELECT COUNT(*) as total FROM users WHERE role = 'user'");
    const [[services]] = await pool.query("SELECT COUNT(*) as total FROM services WHERE status = 'active'");
    const [[transactions]] = await pool.query('SELECT COUNT(*) as total FROM transactions');
    const [[disputes]] = await pool.query("SELECT COUNT(*) as total FROM disputes WHERE status IN ('open', 'under_review')");
    const [[completed]] = await pool.query("SELECT COUNT(*) as total FROM transactions WHERE status = 'completed'");
    const [[totalHours]] = await pool.query("SELECT SUM(hours_exchanged) as total FROM transactions WHERE status = 'completed'");

    const [recentUsers] = await pool.query(
      'SELECT id, email, first_name, last_name, role, time_balance, created_at FROM users ORDER BY created_at DESC LIMIT 10'
    );

    const [recentTransactions] = await pool.query(
      `SELECT t.id, t.hours_exchanged, t.status, t.created_at, s.title as service_title,
              u1.first_name as requester_first, u1.last_name as requester_last,
              u2.first_name as provider_first, u2.last_name as provider_last
       FROM transactions t
       JOIN services s ON t.service_id = s.id
       JOIN users u1 ON t.requester_id = u1.id
       JOIN users u2 ON t.provider_id = u2.id
       ORDER BY t.created_at DESC LIMIT 10`
    );

    const [recentDisputes] = await pool.query(
      `SELECT d.id, d.reason, d.status, d.created_at, s.title as service_title
       FROM disputes d
       JOIN transactions t ON d.transaction_id = t.id
       JOIN services s ON t.service_id = s.id
       ORDER BY d.created_at DESC LIMIT 10`
    );

    res.json({
      stats: {
        total_users: users.total,
        active_services: services.total,
        total_transactions: transactions.total,
        completed_transactions: completed.total,
        open_disputes: disputes.total,
        total_hours_exchanged: totalHours.total || 0
      },
      recentUsers,
      recentTransactions,
      recentDisputes
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, is_active } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE role = 'user'";
    const params = [];

    if (search) {
      whereClause += ' AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }
    if (is_active !== undefined) {
      whereClause += ' AND is_active = ?';
      params.push(is_active === 'true');
    }

    const [users] = await pool.query(
      `SELECT id, email, first_name, last_name, phone, role, time_balance, is_active, email_verified, created_at
       FROM users ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );

    res.json({
      users,
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

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, is_active, time_balance } = req.body;

    const fields = [];
    const values = [];

    if (role !== undefined) { fields.push('role = ?'); values.push(role); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active); }
    if (time_balance !== undefined) { fields.push('time_balance = ?'); values.push(time_balance); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

    const [user] = await pool.query(
      'SELECT id, email, first_name, last_name, role, time_balance, is_active FROM users WHERE id = ?',
      [id]
    );

    if (!user.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAllServices = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND s.status = ?';
      params.push(status);
    }
    if (search) {
      whereClause += ' AND (s.title LIKE ? OR s.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [services] = await pool.query(
      `SELECT s.*, c.name as category_name, u.first_name, u.last_name, u.email as provider_email
       FROM services s
       JOIN categories c ON s.category_id = c.id
       JOIN users u ON s.provider_id = u.id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM services s ${whereClause}`,
      params
    );

    res.json({
      services,
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

export const updateServiceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query('UPDATE services SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);

    const [service] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
    if (!service.length) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ service: service[0] });
  } catch (error) {
    next(error);
  }
};

export const getAllTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
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
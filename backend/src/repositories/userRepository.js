import pool from '../config/db.js';

export const userRepository = {
  async findById(id) {
    const [users] = await pool.query(
      'SELECT id, email, first_name, last_name, phone, address, bio, avatar_url, role, time_balance, is_active, email_verified, created_at FROM users WHERE id = ?',
      [id]
    );
    return users[0] || null;
  },

  async findRawUserById(id, connection = null) {
    const db = connection || pool;
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return users[0] || null;
  },

  async findByEmail(email) {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return users[0] || null;
  },

  async findAuthUserById(id) {
    const [users] = await pool.query(
      'SELECT id, email, first_name, last_name, role, time_balance, is_active FROM users WHERE id = ?',
      [id]
    );
    return users[0] || null;
  },

  async findPasswordHashById(id) {
    const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [id]);
    return users[0]?.password_hash || null;
  },

  async create({ id, email, passwordHash, firstName, lastName, phone }) {
    await pool.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, email, passwordHash, firstName, lastName, phone || null]
    );
    return this.findAuthUserById(id);
  },

  async updateProfile(id, updateData) {
    const fields = [];
    const values = [];

    if (updateData.first_name !== undefined) { fields.push('first_name = ?'); values.push(updateData.first_name); }
    if (updateData.last_name !== undefined) { fields.push('last_name = ?'); values.push(updateData.last_name); }
    if (updateData.phone !== undefined) { fields.push('phone = ?'); values.push(updateData.phone); }
    if (updateData.address !== undefined) { fields.push('address = ?'); values.push(updateData.address); }
    if (updateData.bio !== undefined) { fields.push('bio = ?'); values.push(updateData.bio); }
    if (updateData.avatar_url !== undefined) { fields.push('avatar_url = ?'); values.push(updateData.avatar_url); }

    if (fields.length === 0) return null;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async updatePassword(id, passwordHash) {
    const [result] = await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
    return result.affectedRows > 0;
  },

  async findAllUsers({ page = 1, limit = 20, search, role, is_active } = {}) {
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
    if (is_active !== undefined && is_active !== '') {
      whereClause += ' AND is_active = ?';
      params.push(is_active === 'true' || is_active === true);
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

    return {
      users,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    };
  },

  async updateUserAdmin(id, { role, is_active, time_balance }) {
    const fields = [];
    const values = [];

    if (role !== undefined) { fields.push('role = ?'); values.push(role); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active); }
    if (time_balance !== undefined) { fields.push('time_balance = ?'); values.push(time_balance); }

    if (fields.length === 0) return null;

    values.push(id);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

    const [user] = await pool.query(
      'SELECT id, email, first_name, last_name, role, time_balance, is_active FROM users WHERE id = ?',
      [id]
    );
    return user[0] || null;
  },

  async deleteUser(id) {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

export default userRepository;

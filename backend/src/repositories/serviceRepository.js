import pool from '../config/db.js';

export const serviceRepository = {
  async findCategories() {
    const [categories] = await pool.query('SELECT * FROM categories WHERE is_active = TRUE ORDER BY name');
    return categories;
  },

  async findCategoryById(id) {
    const [categories] = await pool.query('SELECT id FROM categories WHERE id = ? AND is_active = TRUE', [id]);
    return categories[0] || null;
  },

  async createCategory({ id, name, description, icon, color }) {
    await pool.query(
      `INSERT INTO categories (id, name, description, icon, color) VALUES (?, ?, ?, ?, ?)`,
      [id, name, description || null, icon || null, color || '#3B82F6']
    );
    const [category] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    return category[0] || null;
  },

  async createService({ id, providerId, categoryId, title, description, type, durationHours, location, isRemote, tags = [] }) {
    await pool.query(
      `INSERT INTO services (id, provider_id, category_id, title, description, type, duration_hours, location, is_remote)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, providerId, categoryId, title, description, type, durationHours || 1.0, location || null, isRemote || false]
    );

    if (tags && tags.length) {
      for (const tag of tags) {
        await pool.query(
          `INSERT IGNORE INTO service_tags (service_id, tag) VALUES (?, ?)`,
          [id, tag.toLowerCase().trim()]
        );
      }
    }

    return this.findServiceById(id);
  },

  async findServices({ categoryId, type, providerId, search, page = 1, limit = 12, sort = 'newest' } = {}) {
    const offset = (page - 1) * limit;
    let whereClause = "WHERE s.status = 'active'";
    const params = [];

    if (categoryId) {
      whereClause += ' AND s.category_id = ?';
      params.push(categoryId);
    }
    if (type) {
      whereClause += ' AND s.type = ?';
      params.push(type);
    }
    if (providerId) {
      whereClause += ' AND s.provider_id = ?';
      params.push(providerId);
    }
    if (search) {
      whereClause += ' AND (s.title LIKE ? OR s.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    let orderBy = 's.created_at DESC';
    if (sort === 'oldest') orderBy = 's.created_at ASC';
    else if (sort === 'duration') orderBy = 's.duration_hours ASC';
    else if (sort === 'title') orderBy = 's.title ASC';

    const [services] = await pool.query(
      `SELECT s.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
              u.first_name, u.last_name, u.avatar_url
       FROM services s
       JOIN categories c ON s.category_id = c.id
       JOIN users u ON s.provider_id = u.id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const serviceIds = services.map(s => s.id);
    let tagsMap = {};
    if (serviceIds.length) {
      const [tags] = await pool.query(
        `SELECT service_id, tag FROM service_tags WHERE service_id IN (${serviceIds.map(() => '?').join(',')})`,
        serviceIds
      );
      tags.forEach(t => {
        if (!tagsMap[t.service_id]) tagsMap[t.service_id] = [];
        tagsMap[t.service_id].push(t.tag);
      });
    }

    services.forEach(s => {
      s.tags = tagsMap[s.id] || [];
      s.is_remote = Boolean(s.is_remote);
    });

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total
       FROM services s
       JOIN categories c ON s.category_id = c.id
       JOIN users u ON s.provider_id = u.id
       ${whereClause}`,
      params
    );

    return {
      services,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    };
  },

  async findServiceById(id) {
    const [services] = await pool.query(
      `SELECT s.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
              u.first_name, u.last_name, u.avatar_url, u.phone, u.bio, u.time_balance as provider_balance
       FROM services s
       JOIN categories c ON s.category_id = c.id
       JOIN users u ON s.provider_id = u.id
       WHERE s.id = ?`,
      [id]
    );

    if (!services.length) return null;

    const [tags] = await pool.query('SELECT tag FROM service_tags WHERE service_id = ?', [id]);
    services[0].tags = tags.map(t => t.tag);
    services[0].is_remote = Boolean(services[0].is_remote);

    return services[0];
  },

  async findRawServiceById(id, connection = null) {
    const db = connection || pool;
    const [services] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
    return services[0] || null;
  },

  async updateService(id, updateData, tags) {
    const fields = [];
    const values = [];

    if (updateData.title !== undefined) { fields.push('title = ?'); values.push(updateData.title); }
    if (updateData.description !== undefined) { fields.push('description = ?'); values.push(updateData.description); }
    if (updateData.duration_hours !== undefined) { fields.push('duration_hours = ?'); values.push(updateData.duration_hours); }
    if (updateData.location !== undefined) { fields.push('location = ?'); values.push(updateData.location); }
    if (updateData.is_remote !== undefined) { fields.push('is_remote = ?'); values.push(updateData.is_remote); }
    if (updateData.status !== undefined) { fields.push('status = ?'); values.push(updateData.status); }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      await pool.query(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    if (tags !== undefined) {
      await pool.query('DELETE FROM service_tags WHERE service_id = ?', [id]);
      if (tags.length) {
        for (const tag of tags) {
          await pool.query(
            `INSERT IGNORE INTO service_tags (service_id, tag) VALUES (?, ?)`,
            [id, tag.toLowerCase().trim()]
          );
        }
      }
    }

    return this.findServiceById(id);
  },

  async deleteService(id) {
    const [result] = await pool.query('DELETE FROM services WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async findAllServicesAdmin({ page = 1, limit = 20, status, search } = {}) {
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

    return {
      services,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    };
  },

  async updateServiceStatusAdmin(id, status) {
    await pool.query('UPDATE services SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
    const [service] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
    return service[0] || null;
  }
};

export default serviceRepository;

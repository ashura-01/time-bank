import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';

export const createService = async (req, res, next) => {
  try {
    const { category_id, title, description, type, duration_hours, location, is_remote, tags } = req.body;
    const provider_id = req.user.id;

    const [categories] = await pool.query('SELECT id FROM categories WHERE id = ? AND is_active = TRUE', [category_id]);
    if (!categories.length) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const id = uuidv4();
    await pool.query(
      `INSERT INTO services (id, provider_id, category_id, title, description, type, duration_hours, location, is_remote)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, provider_id, category_id, title, description, type, duration_hours || 1.0, location || null, is_remote || false]
    );

    if (tags && tags.length) {
      for (const tag of tags) {
        await pool.query(
          `INSERT IGNORE INTO service_tags (service_id, tag) VALUES (?, ?)`,
          [id, tag.toLowerCase().trim()]
        );
      }
    }

    const [service] = await pool.query(
      `SELECT s.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
              u.first_name, u.last_name, u.avatar_url
       FROM services s
       JOIN categories c ON s.category_id = c.id
       JOIN users u ON s.provider_id = u.id
       WHERE s.id = ?`,
      [id]
    );

    const [serviceTags] = await pool.query('SELECT tag FROM service_tags WHERE service_id = ?', [id]);
    service[0].tags = serviceTags.map(t => t.tag);

    res.status(201).json({ service: service[0] });
  } catch (error) {
    next(error);
  }
};

export const getServices = async (req, res, next) => {
  try {
    const { category_id, type, provider_id, search, page = 1, limit = 12, sort = 'newest' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE s.status = 'active'";
    const params = [];

    if (category_id) {
      whereClause += ' AND s.category_id = ?';
      params.push(category_id);
    }
    if (type) {
      whereClause += ' AND s.type = ?';
      params.push(type);
    }
    if (provider_id) {
      whereClause += ' AND s.provider_id = ?';
      params.push(provider_id);
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
    });

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

export const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [services] = await pool.query(
      `SELECT s.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
              u.first_name, u.last_name, u.avatar_url, u.phone, u.bio, u.time_balance as provider_balance
       FROM services s
       JOIN categories c ON s.category_id = c.id
       JOIN users u ON s.provider_id = u.id
       WHERE s.id = ?`,
      [id]
    );

    if (!services.length) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const [tags] = await pool.query('SELECT tag FROM service_tags WHERE service_id = ?', [id]);
    services[0].tags = tags.map(t => t.tag);

    res.json({ service: services[0] });
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, duration_hours, location, is_remote, status, tags } = req.body;
    const userId = req.user.id;

    const [services] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
    if (!services.length) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = services[0];
    if (service.provider_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this service' });
    }

    const fields = [];
    const values = [];

    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (duration_hours !== undefined) { fields.push('duration_hours = ?'); values.push(duration_hours); }
    if (location !== undefined) { fields.push('location = ?'); values.push(location); }
    if (is_remote !== undefined) { fields.push('is_remote = ?'); values.push(is_remote); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }

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

    const [updated] = await pool.query(
      `SELECT s.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
              u.first_name, u.last_name, u.avatar_url
       FROM services s
       JOIN categories c ON s.category_id = c.id
       JOIN users u ON s.provider_id = u.id
       WHERE s.id = ?`,
      [id]
    );

    const [serviceTags] = await pool.query('SELECT tag FROM service_tags WHERE service_id = ?', [id]);
    updated[0].tags = serviceTags.map(t => t.tag);

    res.json({ service: updated[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [services] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
    if (!services.length) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = services[0];
    if (service.provider_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this service' });
    }

    await pool.query('DELETE FROM services WHERE id = ?', [id]);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories WHERE is_active = TRUE ORDER BY name');
    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, color } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const id = uuidv4();
    await pool.query(
      `INSERT INTO categories (id, name, description, icon, color) VALUES (?, ?, ?, ?, ?)`,
      [id, name, description || null, icon || null, color || '#3B82F6']
    );

    const [category] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    res.status(201).json({ category: category[0] });
  } catch (error) {
    next(error);
  }
};
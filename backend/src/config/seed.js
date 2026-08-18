import pool from './db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Seed categories
    const categories = [
      { id: uuidv4(), name: 'Tutoring', description: 'Academic and skill tutoring', icon: 'book', color: '#3B82F6' },
      { id: uuidv4(), name: 'Home Repair', description: 'Plumbing, electrical, carpentry', icon: 'wrench', color: '#EF4444' },
      { id: uuidv4(), name: 'Cooking', description: 'Meal prep, baking, cooking lessons', icon: 'utensils', color: '#F59E0B' },
      { id: uuidv4(), name: 'Tech Support', description: 'Computer help, setup, troubleshooting', icon: 'monitor', color: '#10B981' },
      { id: uuidv4(), name: 'Gardening', description: 'Landscaping, planting, maintenance', icon: 'leaf', color: '#22C55E' },
      { id: uuidv4(), name: 'Childcare', description: 'Babysitting, tutoring, activities', icon: 'baby', color: '#EC4899' },
      { id: uuidv4(), name: 'Transportation', description: 'Rides, errands, moving help', icon: 'car', color: '#6366F1' },
      { id: uuidv4(), name: 'Design', description: 'Graphic design, UI/UX, illustrations', icon: 'palette', color: '#8B5CF6' }
    ];

    for (const cat of categories) {
      await connection.query(
        `INSERT IGNORE INTO categories (id, name, description, icon, color) VALUES (?, ?, ?, ?, ?)`,
        [cat.id, cat.name, cat.description, cat.icon, cat.color]
      );
    }

    // Create admin user
    const adminId = uuidv4();
    const adminPassword = await bcrypt.hash('admin123', 12);
    await connection.query(
      `INSERT IGNORE INTO users (id, email, password_hash, first_name, last_name, role, time_balance) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [adminId, 'admin@timebank.com', adminPassword, 'Admin', 'User', 'admin', 100.00]
    );

    // Create demo users
    const userPassword = await bcrypt.hash('user123', 12);
    const demoUsers = [
      { id: uuidv4(), email: 'john@timebank.com', first_name: 'John', last_name: 'Smith', phone: '555-0101' },
      { id: uuidv4(), email: 'jane@timebank.com', first_name: 'Jane', last_name: 'Doe', phone: '555-0102' },
      { id: uuidv4(), email: 'bob@timebank.com', first_name: 'Bob', last_name: 'Wilson', phone: '555-0103' },
      { id: uuidv4(), email: 'alice@timebank.com', first_name: 'Alice', last_name: 'Brown', phone: '555-0104' }
    ];

    for (const user of demoUsers) {
      await connection.query(
        `INSERT IGNORE INTO users (id, email, password_hash, first_name, last_name, phone, time_balance) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.email, userPassword, user.first_name, user.last_name, user.phone, 10.00]
      );
    }

    // Get category IDs for seeding services
    const [catRows] = await connection.query(`SELECT id, name FROM categories`);
    const catMap = {};
    catRows.forEach(c => catMap[c.name] = c.id);

    // Seed demo services
    const demoServices = [
      {
        provider_email: 'john@timebank.com',
        category: 'Tutoring',
        title: 'Math Tutoring - Algebra & Calculus',
        description: 'I can help with high school and college level math. Sessions can be in-person or online.',
        type: 'offer',
        duration_hours: 1.5,
        location: 'Downtown Library or Zoom',
        is_remote: true
      },
      {
        provider_email: 'jane@timebank.com',
        category: 'Home Repair',
        title: 'Basic Plumbing Repairs',
        description: 'Fix leaky faucets, unclog drains, toilet repairs. Bring your own parts.',
        type: 'offer',
        duration_hours: 2.0,
        location: 'Your home',
        is_remote: false
      },
      {
        provider_email: 'bob@timebank.com',
        category: 'Cooking',
        title: 'Meal Prep for the Week',
        description: 'I will cook 5 healthy meals for your week. You provide ingredients.',
        type: 'offer',
        duration_hours: 3.0,
        location: 'Your kitchen',
        is_remote: false
      },
      {
        provider_email: 'alice@timebank.com',
        category: 'Tech Support',
        title: 'Computer Setup & Troubleshooting',
        description: 'New computer setup, software installation, virus removal, speed optimization.',
        type: 'offer',
        duration_hours: 2.0,
        location: 'Your home or remote',
        is_remote: true
      },
      {
        provider_email: 'john@timebank.com',
        category: 'Gardening',
        title: 'Need Help with Garden Maintenance',
        description: 'Looking for someone to help with weeding, pruning, and seasonal planting.',
        type: 'request',
        duration_hours: 2.0,
        location: 'My backyard',
        is_remote: false
      },
      {
        provider_email: 'jane@timebank.com',
        category: 'Childcare',
        title: 'Babysitter Needed - Friday Evenings',
        description: 'Need reliable babysitter for 2 kids (ages 4 and 7) on Friday evenings 6-10pm.',
        type: 'request',
        duration_hours: 4.0,
        location: 'My home',
        is_remote: false
      }
    ];

    for (const svc of demoServices) {
      const [userRows] = await connection.query(`SELECT id FROM users WHERE email = ?`, [svc.provider_email]);
      if (userRows.length === 0) continue;

      const serviceId = uuidv4();
      await connection.query(
        `INSERT IGNORE INTO services (id, provider_id, category_id, title, description, type, duration_hours, location, is_remote) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [serviceId, userRows[0].id, catMap[svc.category], svc.title, svc.description, svc.type, svc.duration_hours, svc.location, svc.is_remote]
      );

      // Add some tags
      const tags = svc.category === 'Tutoring' ? ['math', 'algebra', 'calculus', 'homework-help'] :
                   svc.category === 'Home Repair' ? ['plumbing', 'faucet', 'drain', 'toilet'] :
                   svc.category === 'Cooking' ? ['meal-prep', 'healthy', 'weekly'] :
                   svc.category === 'Tech Support' ? ['computer', 'setup', 'troubleshooting', 'virus-removal'] :
                   svc.category === 'Gardening' ? ['weeding', 'pruning', 'planting'] :
                   ['babysitting', 'friday', 'evening'];

      for (const tag of tags) {
        await connection.query(
          `INSERT IGNORE INTO service_tags (service_id, tag) VALUES (?, ?)`,
          [serviceId, tag]
        );
      }
    }

    await connection.commit();
    console.log('Seed data inserted successfully');
  } catch (error) {
    await connection.rollback();
    console.error('Seed failed:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

seed();
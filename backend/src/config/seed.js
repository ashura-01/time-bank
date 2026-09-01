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
    console.log('Base seed data inserted successfully');

    // -------------------------------------------------------------------
    // Extended seed data — more users/services/transactions/reviews so the
    // analytics/insight queries in adminController.js have real data to
    // return. Guarded so re-running `npm run db:seed` doesn't duplicate
    // this block (transactions/reviews have no natural unique key to rely
    // on for INSERT IGNORE the way categories/users do).
    // -------------------------------------------------------------------
    const [[{ alreadySeeded }]] = await pool.query(
      "SELECT COUNT(*) as alreadySeeded FROM users WHERE email = 'priya@timebank.com'"
    );
    if (alreadySeeded > 0) {
      console.log('Extended seed data already present — skipping.');
      return;
    }

    const connection2 = await pool.getConnection();
    try {
      await connection2.beginTransaction();

      // More demo users (same user123 password as the originals)
      const moreUsers = [
        { id: uuidv4(), email: 'sam@timebank.com', first_name: 'Sam', last_name: 'Carter', phone: '555-0105' },
        { id: uuidv4(), email: 'maria@timebank.com', first_name: 'Maria', last_name: 'Garcia', phone: '555-0106' },
        { id: uuidv4(), email: 'chris@timebank.com', first_name: 'Chris', last_name: 'Lee', phone: '555-0107' },
        { id: uuidv4(), email: 'priya@timebank.com', first_name: 'Priya', last_name: 'Patel', phone: '555-0108' },
      ];
      for (const user of moreUsers) {
        await connection2.query(
          `INSERT IGNORE INTO users (id, email, password_hash, first_name, last_name, phone, time_balance) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [user.id, user.email, userPassword, user.first_name, user.last_name, user.phone, 10.00]
        );
      }

      // Give the 8 demo users varied balances so above/below-average
      // queries have something meaningful to split on (avg lands ~10.1h)
      const balances = {
        'john@timebank.com': 15.00,
        'jane@timebank.com': 6.00,
        'bob@timebank.com': 22.00,
        'alice@timebank.com': 4.00,
        'sam@timebank.com': 9.00,
        'maria@timebank.com': 13.00,
        'chris@timebank.com': 7.00,
        'priya@timebank.com': 5.00, // stays untouched by any transaction below
      };
      for (const [email, bal] of Object.entries(balances)) {
        await connection2.query('UPDATE users SET time_balance = ? WHERE email = ?', [bal, email]);
      }

      const [allUserRows] = await connection2.query(
        `SELECT id, email FROM users WHERE email IN (?, ?, ?, ?, ?, ?, ?, ?)`,
        Object.keys(balances)
      );
      const uid = {};
      allUserRows.forEach(u => uid[u.email.split('@')[0]] = u.id);

      const [catRows2] = await connection2.query('SELECT id, name FROM categories');
      const catMap2 = {};
      catRows2.forEach(c => catMap2[c.name] = c.id);

      // More services — each new one deliberately sized above or below its
      // category's existing average so the "above_category_avg" insight
      // query has a real split to demonstrate.
      const moreServices = [
        { key: 'essay', provider: 'sam', category: 'Tutoring', title: 'English Essay Writing Help', description: 'Help polishing essays, grammar, structure, and argument.', type: 'offer', duration_hours: 1.0, is_remote: true },
        { key: 'guitar', provider: 'maria', category: 'Tutoring', title: 'Guitar Lessons for Beginners', description: 'Learn chords, strumming patterns, and your first songs.', type: 'offer', duration_hours: 2.5, is_remote: false },
        { key: 'electrical', provider: 'chris', category: 'Home Repair', title: 'Electrical Wiring Fix', description: 'Outlet repairs, light fixture installs, minor wiring issues.', type: 'offer', duration_hours: 3.5, is_remote: false },
        { key: 'baking', provider: 'priya', category: 'Cooking', title: 'Baking Class - Bread Making', description: 'Learn to bake sourdough and basic yeast breads from scratch.', type: 'offer', duration_hours: 1.5, is_remote: false },
        { key: 'smartphone', provider: 'sam', category: 'Tech Support', title: 'Smartphone Setup Help', description: 'Need help setting up a new phone, transferring data, and apps.', type: 'request', duration_hours: 1.0, is_remote: true },
        { key: 'lawnmowing', provider: 'maria', category: 'Gardening', title: 'Lawn Mowing Service', description: 'Weekly or one-off lawn mowing and edging.', type: 'offer', duration_hours: 1.5, is_remote: false },
        { key: 'nanny', provider: 'chris', category: 'Childcare', title: 'Weekend Nanny Available', description: 'Experienced weekend childcare, ages 2-10.', type: 'offer', duration_hours: 5.0, is_remote: false },
      ];

      const sid = {};
      for (const svc of moreServices) {
        const serviceId = uuidv4();
        sid[svc.key] = serviceId;
        await connection2.query(
          `INSERT INTO services (id, provider_id, category_id, title, description, type, duration_hours, is_remote) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [serviceId, uid[svc.provider], catMap2[svc.category], svc.title, svc.description, svc.type, svc.duration_hours, svc.is_remote]
        );
      }

      // Fetch the ids of the 6 original services (created earlier in this
      // same run, or on a prior run) so transactions can reference them too
      const [origServiceRows] = await connection2.query(
        `SELECT id, title FROM services WHERE title IN (
          'Math Tutoring - Algebra & Calculus', 'Basic Plumbing Repairs', 'Meal Prep for the Week',
          'Computer Setup & Troubleshooting', 'Need Help with Garden Maintenance', 'Babysitter Needed - Friday Evenings'
        )`
      );
      const origTitleToId = {};
      origServiceRows.forEach(s => origTitleToId[s.title] = s.id);
      sid.mathTutoring = origTitleToId['Math Tutoring - Algebra & Calculus'];
      sid.plumbing = origTitleToId['Basic Plumbing Repairs'];
      sid.mealPrep = origTitleToId['Meal Prep for the Week'];
      sid.computerSetup = origTitleToId['Computer Setup & Troubleshooting'];
      sid.gardenMaintenance = origTitleToId['Need Help with Garden Maintenance'];
      sid.babysitter = origTitleToId['Babysitter Needed - Friday Evenings'];

      // Look up provider_id for every service referenced below, since a
      // transaction's provider_id always comes from the service, not
      // whoever created the transaction request.
      const [svcProviderRows] = await connection2.query(
        `SELECT id, provider_id FROM services WHERE id IN (?)`,
        [Object.values(sid)]
      );
      const svcProvider = {};
      svcProviderRows.forEach(s => svcProvider[s.id] = s.provider_id);

      // Transactions spread across every day of the week and a mix of
      // statuses. `priya` and the `essay` service are deliberately left
      // out of every transaction so they show up under the "no
      // transactions" / "unused service" insight filters.
      const transactions = [
        { service: 'mathTutoring', requester: 'jane', hours: 1.5, status: 'completed', created_at: '2026-08-17 10:00:00' },
        { service: 'mathTutoring', requester: 'bob', hours: 1.5, status: 'completed', created_at: '2026-08-24 14:00:00' },
        { service: 'guitar', requester: 'chris', hours: 2.5, status: 'completed', created_at: '2026-08-21 14:30:00' },
        { service: 'plumbing', requester: 'john', hours: 2.0, status: 'completed', created_at: '2026-08-18 11:00:00' },
        { service: 'electrical', requester: 'bob', hours: 3.5, status: 'completed', created_at: '2026-08-19 15:00:00' },
        { service: 'mealPrep', requester: 'chris', hours: 3.0, status: 'completed', created_at: '2026-08-10 09:00:00' },
        { service: 'mealPrep', requester: 'maria', hours: 3.0, status: 'completed', created_at: '2026-08-17 16:00:00' },
        { service: 'computerSetup', requester: 'jane', hours: 2.0, status: 'completed', created_at: '2026-08-20 09:30:00' },
        { service: 'smartphone', requester: 'maria', hours: 1.0, status: 'completed', created_at: '2026-08-14 10:00:00' },
        { service: 'gardenMaintenance', requester: 'chris', hours: 2.0, status: 'completed', created_at: '2026-08-11 13:00:00' },
        { service: 'lawnmowing', requester: 'alice', hours: 1.5, status: 'completed', created_at: '2026-08-24 09:00:00' },
        { service: 'babysitter', requester: 'alice', hours: 4.0, status: 'confirmed', created_at: '2026-08-22 11:00:00' },
        { service: 'nanny', requester: 'bob', hours: 5.0, status: 'pending', created_at: '2026-08-16 15:00:00' },
        { service: 'guitar', requester: 'john', hours: 2.5, status: 'cancelled', created_at: '2026-08-13 12:00:00' },
        { service: 'electrical', requester: 'alice', hours: 3.5, status: 'disputed', created_at: '2026-08-19 17:00:00' },
      ];

      const txId = {};
      for (const [i, tx] of transactions.entries()) {
        const id = uuidv4();
        txId[`${tx.service}_${tx.requester}`] = id;
        const completedAt = tx.status === 'completed' ? tx.created_at : null;
        await connection2.query(
          `INSERT INTO transactions (id, service_id, requester_id, provider_id, hours_exchanged, status, created_at, completed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, sid[tx.service], uid[tx.requester], svcProvider[sid[tx.service]], tx.hours, tx.status, tx.created_at, completedAt]
        );
      }

      // Reviews tied to completed transactions — enough that a couple of
      // users clear the >=2 threshold for the rating leaderboard's HAVING
      // clause, while others sit at 0 or 1 for contrast.
      const reviews = [
        { tx: 'mathTutoring_jane', reviewer: 'jane', reviewee: 'john', rating: 5, comment: 'Great tutor, very patient!' },
        { tx: 'mathTutoring_bob', reviewer: 'bob', reviewee: 'john', rating: 4, comment: 'Helped me finally understand derivatives.' },
        { tx: 'mealPrep_chris', reviewer: 'chris', reviewee: 'bob', rating: 5, comment: 'Delicious and healthy meals all week.' },
        { tx: 'mealPrep_maria', reviewer: 'maria', reviewee: 'bob', rating: 3, comment: 'Good but a bit bland for my taste.' },
        { tx: 'plumbing_john', reviewer: 'john', reviewee: 'jane', rating: 5, comment: 'Fixed the leak in 20 minutes.' },
        { tx: 'computerSetup_jane', reviewer: 'jane', reviewee: 'alice', rating: 4, comment: 'Very knowledgeable, quick setup.' },
        { tx: 'guitar_chris', reviewer: 'chris', reviewee: 'maria', rating: 5, comment: 'Learned my first song in one session!' },
        { tx: 'lawnmowing_alice', reviewer: 'alice', reviewee: 'maria', rating: 4, comment: 'Lawn looks great, on time.' },
        { tx: 'electrical_bob', reviewer: 'bob', reviewee: 'chris', rating: 3, comment: 'Job done but took longer than expected.' },
      ];
      for (const r of reviews) {
        if (!txId[r.tx]) continue;
        await connection2.query(
          `INSERT IGNORE INTO reviews (id, transaction_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), txId[r.tx], uid[r.reviewer], uid[r.reviewee], r.rating, r.comment]
        );
      }

      // A couple of disputes for the admin disputes page
      if (txId['electrical_alice']) {
        await connection2.query(
          `INSERT INTO disputes (id, transaction_id, raised_by, reason, status) VALUES (?, ?, ?, ?, ?)`,
          [uuidv4(), txId['electrical_alice'], uid['alice'], 'Wiring was left exposed and unsafe, provider never returned to finish the job.', 'open']
        );
      }
      const [adminRow] = await connection2.query(`SELECT id FROM users WHERE email = 'admin@timebank.com'`);
      if (txId['electrical_bob'] && adminRow.length) {
        await connection2.query(
          `INSERT INTO disputes (id, transaction_id, raised_by, reason, status, resolution, resolved_by, resolved_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [uuidv4(), txId['electrical_bob'], uid['bob'], 'Job took much longer than the agreed hours.', 'resolved', 'Provider agreed to a partial hour refund.', adminRow[0].id]
        );
      }

      await connection2.commit();
      console.log('Extended seed data inserted successfully');
    } catch (error) {
      await connection2.rollback();
      console.error('Extended seed failed:', error);
      throw error;
    } finally {
      connection2.release();
    }
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
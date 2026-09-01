import pool from '../config/db.js';

export const analyticsRepository = {
  async getDashboardStats() {
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
      `SELECT d.id, d.reason, d.status, d.created_at, s.title as service_title,
              u.first_name as raised_first, u.last_name as raised_last
       FROM disputes d
       JOIN transactions t ON d.transaction_id = t.id
       JOIN services s ON t.service_id = s.id
       JOIN users u ON d.raised_by = u.id
       ORDER BY d.created_at DESC LIMIT 10`
    );

    return {
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
    };
  },

  async getAnalytics() {
    // 1. Top providers by hours delivered
    const [topProviders] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name,
              SUM(t.hours_exchanged) AS total_hours,
              COUNT(*) AS completed_count
       FROM transactions t
       JOIN users u ON u.id = t.provider_id
       WHERE t.status = 'completed'
       GROUP BY u.id, u.first_name, u.last_name
       ORDER BY total_hours DESC
       LIMIT 5`
    );

    // 2. Category demand
    const [categoryDemand] = await pool.query(
      `SELECT c.id, c.name,
              COUNT(DISTINCT s.id) AS service_count,
              COUNT(t.id) AS times_requested,
              ROUND(AVG(t.hours_exchanged), 2) AS avg_hours_per_exchange
       FROM categories c
       LEFT JOIN services s ON s.category_id = c.id
       LEFT JOIN transactions t ON t.service_id = s.id AND t.status = 'completed'
       GROUP BY c.id, c.name
       ORDER BY times_requested DESC`
    );

    // 3. Busiest day of week
    const [busiestDays] = await pool.query(
      `SELECT DAYNAME(created_at) AS day_name,
              COUNT(*) AS transaction_count
       FROM transactions
       GROUP BY DAYOFWEEK(created_at), day_name
       ORDER BY transaction_count DESC`
    );

    // 4. Rating leaderboard
    const [ratingLeaders] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name,
              ROUND(AVG(r.rating), 2) AS avg_rating,
              COUNT(r.id) AS review_count
       FROM reviews r
       JOIN users u ON u.id = r.reviewee_id
       GROUP BY u.id, u.first_name, u.last_name
       HAVING COUNT(r.id) >= 2
       ORDER BY avg_rating DESC, review_count DESC
       LIMIT 5`
    );

    // 5. Platform-wide MAX / MIN / AVG summary
    const [[exchangeStats]] = await pool.query(
      `SELECT
         MAX(hours_exchanged) AS longest_exchange,
         MIN(hours_exchanged) AS shortest_exchange,
         ROUND(AVG(hours_exchanged), 2) AS avg_exchange_length,
         SUM(hours_exchanged) AS total_hours_all_time
       FROM transactions
       WHERE status = 'completed'`
    );

    return {
      topProviders,
      categoryDemand,
      busiestDays,
      ratingLeaders,
      exchangeStats
    };
  },

  async getUserReport(id) {
    const [[user]] = await pool.query(
      'SELECT id, email, first_name, last_name, time_balance, created_at FROM users WHERE id = ?',
      [id]
    );
    if (!user) return null;

    const [[hoursSummary]] = await pool.query(
      `SELECT
         SUM(CASE WHEN provider_id = ? AND status = 'completed' THEN hours_exchanged ELSE 0 END) AS hours_earned,
         SUM(CASE WHEN requester_id = ? AND status = 'completed' THEN hours_exchanged ELSE 0 END) AS hours_spent,
         COUNT(CASE WHEN provider_id = ? THEN 1 END) AS times_provided,
         COUNT(CASE WHEN requester_id = ? THEN 1 END) AS times_requested
       FROM transactions
       WHERE provider_id = ? OR requester_id = ?`,
      [id, id, id, id, id, id]
    );

    const [services] = await pool.query(
      `SELECT s.id, s.title, s.type, s.status, c.name AS category_name
       FROM services s
       JOIN categories c ON c.id = s.category_id
       WHERE s.provider_id = ?
       ORDER BY s.created_at DESC`,
      [id]
    );

    const [[ratingSummary]] = await pool.query(
      `SELECT ROUND(AVG(rating), 2) AS avg_rating, COUNT(*) AS review_count
       FROM reviews
       WHERE reviewee_id = ?`,
      [id]
    );

    const [[rankRow]] = await pool.query(
      `SELECT COUNT(*) + 1 AS rank_position
       FROM (
         SELECT provider_id, SUM(hours_exchanged) AS total_hours
         FROM transactions
         WHERE status = 'completed'
         GROUP BY provider_id
       ) AS provider_totals
       WHERE total_hours > COALESCE((
         SELECT SUM(hours_exchanged)
         FROM transactions
         WHERE provider_id = ? AND status = 'completed'
       ), 0)`,
      [id]
    );

    const [[balanceComparison]] = await pool.query(
      `SELECT time_balance > (SELECT AVG(time_balance) FROM users) AS above_average_balance,
              (SELECT ROUND(AVG(time_balance), 2) FROM users) AS platform_avg_balance
       FROM users WHERE id = ?`,
      [id]
    );

    return {
      user,
      hoursSummary,
      services,
      ratingSummary,
      rank: rankRow.rank_position,
      balanceComparison
    };
  },

  async getUserInsights(type) {
    let rows;

    switch (type) {
      case 'no_transactions':
        [rows] = await pool.query(
          `SELECT u.id, u.first_name, u.last_name, u.email, u.created_at
           FROM users u
           LEFT JOIN transactions t ON t.provider_id = u.id OR t.requester_id = u.id
           WHERE u.role = 'user' AND t.id IS NULL
           ORDER BY u.created_at DESC`
        );
        break;

      case 'never_reviewed':
        [rows] = await pool.query(
          `SELECT id, first_name, last_name, email, created_at
           FROM users
           WHERE role = 'user'
             AND id NOT IN (SELECT DISTINCT reviewee_id FROM reviews)
           ORDER BY created_at DESC`
        );
        break;

      case 'above_avg_balance':
        [rows] = await pool.query(
          `SELECT id, first_name, last_name, email, time_balance
           FROM users
           WHERE role = 'user'
             AND time_balance > (SELECT AVG(time_balance) FROM users)
           ORDER BY time_balance DESC`
        );
        break;

      case 'dual_role':
        [rows] = await pool.query(
          `SELECT id, first_name, last_name, email
           FROM users u
           WHERE role = 'user'
             AND EXISTS (SELECT 1 FROM transactions t WHERE t.provider_id = u.id)
             AND EXISTS (SELECT 1 FROM transactions t WHERE t.requester_id = u.id)`
        );
        break;

      default:
        return null;
    }

    return rows;
  },

  async getServiceInsights(type) {
    let rows;

    switch (type) {
      case 'unused':
        [rows] = await pool.query(
          `SELECT s.id, s.title, s.type, s.status, c.name AS category_name,
                  u.first_name, u.last_name
           FROM services s
           JOIN categories c ON c.id = s.category_id
           JOIN users u ON s.provider_id = u.id
           LEFT JOIN transactions t ON t.service_id = s.id
           WHERE t.id IS NULL
           ORDER BY s.created_at DESC`
        );
        break;

      case 'above_category_avg':
        [rows] = await pool.query(
          `SELECT s.id, s.title, s.duration_hours, c.name AS category_name,
                  (SELECT ROUND(AVG(s2.duration_hours), 2)
                   FROM services s2
                   WHERE s2.category_id = s.category_id) AS category_avg_hours
           FROM services s
           JOIN categories c ON s.category_id = c.id
           WHERE s.duration_hours > (
             SELECT AVG(s3.duration_hours)
             FROM services s3
             WHERE s3.category_id = s.category_id
           )
           ORDER BY c.name`
        );
        break;

      default:
        return null;
    }

    return rows;
  }
};

export default analyticsRepository;

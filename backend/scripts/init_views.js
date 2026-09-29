import pool from '../src/config/db.js';

async function init() {
  try {
    console.log('Creating vw_transaction_details...');
    await pool.query(`
      CREATE OR REPLACE VIEW vw_transaction_details AS
      SELECT t.*, 
             s.title as service_title, 
             s.type as service_type, 
             s.description as service_description,
             u1.first_name as requester_first, 
             u1.last_name as requester_last, 
             u1.email as requester_email,
             u2.first_name as provider_first, 
             u2.last_name as provider_last, 
             u2.email as provider_email
      FROM transactions t
      JOIN services s ON t.service_id = s.id
      JOIN users u1 ON t.requester_id = u1.id
      JOIN users u2 ON t.provider_id = u2.id
    `);
    
    console.log('Creating vw_service_details...');
    await pool.query(`
      CREATE OR REPLACE VIEW vw_service_details AS
      SELECT s.*, 
             c.name as category_name, 
             c.icon as category_icon, 
             c.color as category_color,
             u.first_name, 
             u.last_name, 
             u.avatar_url, 
             u.email as provider_email, 
             u.phone, 
             u.bio, 
             u.time_balance as provider_balance
      FROM services s
      JOIN categories c ON s.category_id = c.id
      JOIN users u ON s.provider_id = u.id
    `);

    console.log('Creating sp_get_user_dashboard_stats...');
    await pool.query(`DROP PROCEDURE IF EXISTS sp_get_user_dashboard_stats`);
    await pool.query(`
      CREATE PROCEDURE sp_get_user_dashboard_stats(IN p_user_id VARCHAR(36))
      BEGIN
        SELECT 
          (SELECT COUNT(*) FROM services WHERE provider_id = p_user_id AND status = 'active') as active_services,
          (SELECT COUNT(*) FROM transactions WHERE provider_id = p_user_id AND status = 'completed') as completed_as_provider,
          (SELECT COUNT(*) FROM transactions WHERE requester_id = p_user_id AND status = 'completed') as completed_as_requester,
          u.time_balance,
          u.held_balance
        FROM users u
        WHERE u.id = p_user_id;
      END
    `);

    console.log('Creating sp_search_active_services...');
    await pool.query(`DROP PROCEDURE IF EXISTS sp_search_active_services`);
    await pool.query(`
      CREATE PROCEDURE sp_search_active_services(
        IN p_category_id VARCHAR(36),
        IN p_type VARCHAR(20),
        IN p_search VARCHAR(255),
        IN p_limit INT,
        IN p_offset INT
      )
      BEGIN
        SELECT *
        FROM vw_service_details
        WHERE status = 'active'
          AND (p_category_id IS NULL OR category_id = p_category_id)
          AND (p_type IS NULL OR type = p_type)
          AND (p_search IS NULL OR title LIKE CONCAT('%', p_search, '%') OR description LIKE CONCAT('%', p_search, '%'))
        ORDER BY created_at DESC
        LIMIT p_limit OFFSET p_offset;
      END
    `);

    console.log('Successfully created all views and procedures!');
    process.exit(0);
  } catch (err) {
    console.error('Error executing SQL:', err);
    process.exit(1);
  }
}

init();

import pool from './db.js';

const migrations = [
  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    bio TEXT,
    avatar_url VARCHAR(500),
    role ENUM('user', 'admin') DEFAULT 'user',
    time_balance DECIMAL(10,2) DEFAULT 5.00,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
  )`,

  // Categories table
  `CREATE TABLE IF NOT EXISTS categories (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Services table
  `CREATE TABLE IF NOT EXISTS services (
    id CHAR(36) PRIMARY KEY,
    provider_id CHAR(36) NOT NULL,
    category_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type ENUM('offer', 'request') NOT NULL,
    duration_hours DECIMAL(5,2) DEFAULT 1.00,
    location VARCHAR(255),
    is_remote BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive', 'completed', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_provider (provider_id),
    INDEX idx_category (category_id),
    INDEX idx_type (type),
    INDEX idx_status (status)
  )`,

  // Transactions table
  `CREATE TABLE IF NOT EXISTS transactions (
    id CHAR(36) PRIMARY KEY,
    service_id CHAR(36) NOT NULL,
    requester_id CHAR(36) NOT NULL,
    provider_id CHAR(36) NOT NULL,
    hours_exchanged DECIMAL(5,2) NOT NULL,
    scheduled_at TIMESTAMP NULL,
    location VARCHAR(255),
    is_remote BOOLEAN DEFAULT FALSE,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'disputed') DEFAULT 'pending',
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_requester (requester_id),
    INDEX idx_provider (provider_id),
    INDEX idx_status (status)
  )`,

  // Ledger entries table (auditable time-credit ledger)
  `CREATE TABLE IF NOT EXISTS ledger_entries (
    id CHAR(36) PRIMARY KEY,
    transaction_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    entry_type ENUM('credit', 'debit') NOT NULL,
    hours DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_user (user_id),
    INDEX idx_transaction (transaction_id)
  )`,

  // Reviews table
  `CREATE TABLE IF NOT EXISTS reviews (
    id CHAR(36) PRIMARY KEY,
    transaction_id CHAR(36) NOT NULL,
    reviewer_id CHAR(36) NOT NULL,
    reviewee_id CHAR(36) NOT NULL,
    rating TINYINT UNSIGNED NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_review (transaction_id, reviewer_id),
    INDEX idx_reviewee (reviewee_id)
  )`,

  // Disputes table
  `CREATE TABLE IF NOT EXISTS disputes (
    id CHAR(36) PRIMARY KEY,
    transaction_id CHAR(36) NOT NULL,
    raised_by CHAR(36) NOT NULL,
    reason TEXT NOT NULL,
    evidence TEXT,
    status ENUM('open', 'under_review', 'resolved', 'rejected') DEFAULT 'open',
    resolution TEXT,
    resolved_by CHAR(36),
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (raised_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_transaction (transaction_id),
    INDEX idx_status (status)
  )`,

  // Service tags (many-to-many)
  `CREATE TABLE IF NOT EXISTS service_tags (
    service_id CHAR(36) NOT NULL,
    tag VARCHAR(50) NOT NULL,
    PRIMARY KEY (service_id, tag),
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
  )`
];

async function runMigrations() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const sql of migrations) {
      await connection.query(sql);
    }
    await connection.commit();
    console.log('All migrations completed successfully');
  } catch (error) {
    await connection.rollback();
    console.error('Migration failed:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

runMigrations();
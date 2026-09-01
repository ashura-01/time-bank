import pool from '../config/db.js';

/**
 * Executes a callback within a managed database transaction.
 * Automatically handles getConnection, beginTransaction, commit, rollback, and release.
 *
 * @template T
 * @param {(connection: import('mysql2/promise').PoolConnection) => Promise<T>} callback
 * @returns {Promise<T>}
 */
export async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Optional TLS support for hosted MySQL providers (Aiven, PlanetScale, etc.)
// that require an SSL connection. Set DB_SSL_CA to the path of the
// downloaded ca.pem to enable it; leave unset for a plain local connection.
let ssl;
if (process.env.DB_SSL_CA) {
  ssl = { ca: fs.readFileSync(process.env.DB_SSL_CA), rejectUnauthorized: true };
} else if (process.env.DB_SSL === 'true') {
  ssl = { rejectUnauthorized: true };
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'timebank',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
  ...(ssl && { ssl })
});

export default pool;
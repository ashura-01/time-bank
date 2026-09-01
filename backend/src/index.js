import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import serviceRoutes from './routes/services.js';
import transactionRoutes from './routes/transactions.js';
import reviewRoutes from './routes/reviews.js';
import disputeRoutes from './routes/disputes.js';
import adminRoutes from './routes/admin.js';
import { handleError } from './middleware/validate.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(handleError);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

import pool from './config/db.js';

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM users LIKE 'held_balance'");
    if (cols.length === 0) {
      console.error('⚠️ [CRITICAL SCHEMA ERROR] "held_balance" column is missing from "users" table. Run "node src/config/migrate.js" to enable escrow protection.');
    } else {
      console.log('✅ Escrow protection active: "held_balance" column verified.');
    }
  } catch (err) {
    console.error('⚠️ Could not verify database schema on startup:', err.message);
  }
});

export default app;
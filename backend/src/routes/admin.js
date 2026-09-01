import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllServices,
  updateServiceStatus,
  getAllTransactions,
  getAnalytics,
  getUserReport,
  getUserInsight,
  getServiceInsight
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/users', getAllUsers);
router.get('/users/insights/:type', getUserInsight);
router.get('/users/:id/report', getUserReport);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/services', getAllServices);
router.get('/services/insights/:type', getServiceInsight);
router.put('/services/:id/status', updateServiceStatus);
router.get('/transactions', getAllTransactions);

export default router;
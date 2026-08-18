import express from 'express';
import {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  getCategories,
  createCategory
} from '../controllers/serviceController.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import {
  createServiceValidation,
  updateServiceValidation,
  getServicesValidation
} from '../validators/services.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.get('/categories', getCategories);
router.post('/categories', authenticate, authorize('admin'), createCategory);

router.get('/', optionalAuth, getServicesValidation, validate, getServices);
router.get('/:id', getServiceById);
router.post('/', authenticate, createServiceValidation, validate, createService);
router.put('/:id', authenticate, updateServiceValidation, validate, updateService);
router.delete('/:id', authenticate, deleteService);

export default router;
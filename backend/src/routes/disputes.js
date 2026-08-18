import express from 'express';
import { createDispute, getDisputes, getDisputeById, resolveDispute } from '../controllers/disputeController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createDisputeValidation, resolveDisputeValidation, getDisputesValidation } from '../validators/disputes.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getDisputesValidation, validate, getDisputes);
router.get('/:id', getDisputeById);
router.post('/', createDisputeValidation, validate, createDispute);
router.put('/:id/resolve', authorize('admin'), resolveDisputeValidation, validate, resolveDispute);

export default router;
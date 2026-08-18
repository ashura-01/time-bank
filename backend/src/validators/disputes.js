import { body, param, query } from 'express-validator';

export const createDisputeValidation = [
  body('transaction_id').isUUID().withMessage('Valid transaction ID required'),
  body('reason').trim().isLength({ min: 20, max: 2000 }).withMessage('Reason 20-2000 characters'),
  body('evidence').optional().trim().isLength({ max: 5000 })
];

export const resolveDisputeValidation = [
  param('id').isUUID().withMessage('Valid dispute ID required'),
  body('resolution').trim().isLength({ min: 10, max: 2000 }).withMessage('Resolution 10-2000 chars'),
  body('status').isIn(['resolved', 'rejected']).withMessage('Status must be resolved or rejected')
];

export const getDisputesValidation = [
  query('status').optional().isIn(['open', 'under_review', 'resolved', 'rejected']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
];
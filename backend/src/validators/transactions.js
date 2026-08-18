import { body, param, query } from 'express-validator';

export const createTransactionValidation = [
  body('service_id').isUUID().withMessage('Valid service ID required'),
  body('hours_exchanged').isFloat({ min: 0.25, max: 100 }).withMessage('Hours 0.25-100'),
  body('scheduled_at').optional({ checkFalsy: true }).isISO8601().withMessage('Valid ISO date required'),
  body('location').optional({ checkFalsy: true }).trim().isLength({ max: 255 }),
  body('is_remote').optional().isBoolean()
];

export const updateTransactionValidation = [
  param('id').isUUID().withMessage('Valid transaction ID required'),
  body('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled', 'disputed']),
  body('scheduled_at').optional({ checkFalsy: true }).isISO8601().withMessage('Valid ISO date required'),
  body('location').optional({ checkFalsy: true }).trim().isLength({ max: 255 }),
  body('is_remote').optional().isBoolean()
];

export const getTransactionsValidation = [
  query('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled', 'disputed']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
];
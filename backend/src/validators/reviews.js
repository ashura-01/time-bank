import { body, param, query } from 'express-validator';

export const createReviewValidation = [
  body('transaction_id').isUUID().withMessage('Valid transaction ID required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating 1-5 required'),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment max 1000 chars')
];

export const getReviewsValidation = [
  query('reviewee_id').optional().isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
];
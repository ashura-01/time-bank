import { body, query, param } from 'express-validator';

export const createServiceValidation = [
  body('category_id').isUUID().withMessage('Valid category ID required'),
  body('title').trim().isLength({ min: 5, max: 255 }).withMessage('Title 5-255 characters'),
  body('description').trim().isLength({ min: 20 }).withMessage('Description at least 20 characters'),
  body('type').isIn(['offer', 'request']).withMessage('Type must be offer or request'),
  body('duration_hours').optional().isFloat({ min: 0.25, max: 100 }).withMessage('Duration 0.25-100 hours'),
  body('location').optional().trim().isLength({ max: 255 }),
  body('is_remote').optional().isBoolean(),
  body('tags').optional().isArray(),
  body('tags.*').optional().trim().isLength({ min: 1, max: 50 })
];

export const updateServiceValidation = [
  param('id').isUUID().withMessage('Valid service ID required'),
  body('title').optional().trim().isLength({ min: 5, max: 255 }),
  body('description').optional().trim().isLength({ min: 20 }),
  body('duration_hours').optional().isFloat({ min: 0.25, max: 100 }),
  body('location').optional().trim().isLength({ max: 255 }),
  body('is_remote').optional().isBoolean(),
  body('status').optional().isIn(['active', 'inactive', 'completed', 'cancelled']),
  body('tags').optional().isArray(),
  body('tags.*').optional().trim().isLength({ min: 1, max: 50 })
];

export const getServicesValidation = [
  query('category_id').optional({ checkFalsy: true }).isUUID(),
  query('type').optional({ checkFalsy: true }).isIn(['offer', 'request']),
  query('provider_id').optional({ checkFalsy: true }).isUUID(),
  query('search').optional({ checkFalsy: true }).trim(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('sort').optional().isIn(['newest', 'oldest', 'duration', 'title'])
];
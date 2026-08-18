import { body } from 'express-validator';

export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('first_name').trim().isLength({ min: 1, max: 100 }).withMessage('First name required'),
  body('last_name').trim().isLength({ min: 1, max: 100 }).withMessage('Last name required'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone().withMessage('Valid phone number required')
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
];

export const updateProfileValidation = [
  body('first_name').optional({ checkFalsy: true }).trim().isLength({ min: 1, max: 100 }).withMessage('First name must be 1-100 characters'),
  body('last_name').optional({ checkFalsy: true }).trim().isLength({ min: 1, max: 100 }).withMessage('Last name must be 1-100 characters'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone().withMessage('Valid phone number required'),
  body('address').optional({ checkFalsy: true }).trim(),
  body('bio').optional({ checkFalsy: true }).trim(),
  body('avatar_url').optional({ checkFalsy: true }).isURL().withMessage('Avatar must be a valid URL')
];
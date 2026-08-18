import express from 'express';
import { createReview, getReviews, getReviewById } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';
import { createReviewValidation, getReviewsValidation } from '../validators/reviews.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getReviewsValidation, validate, getReviews);
router.get('/:id', getReviewById);
router.post('/', createReviewValidation, validate, createReview);

export default router;
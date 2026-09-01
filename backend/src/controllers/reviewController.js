import { v4 as uuidv4 } from 'uuid';
import { reviewRepository } from '../repositories/reviewRepository.js';
import { transactionRepository } from '../repositories/transactionRepository.js';
import { Review, Transaction } from '../models/index.js';

export const createReview = async (req, res, next) => {
  try {
    const { transaction_id, rating, comment } = req.body;
    const reviewer_id = req.user.id;

    if (!Review.isValidRating(rating)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const rawTx = await transactionRepository.findRawTransactionById(null, transaction_id);
    if (!rawTx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const tx = new Transaction(rawTx);
    if (tx.status !== Transaction.Status.COMPLETED) {
      return res.status(400).json({ error: 'Can only review completed transactions' });
    }

    if (!tx.isParticipant(reviewer_id)) {
      return res.status(403).json({ error: 'Not part of this transaction' });
    }

    const reviewee_id = Review.getRevieweeId(tx, reviewer_id);

    const existing = await reviewRepository.findExistingReview(transaction_id, reviewer_id);
    if (existing) {
      return res.status(409).json({ error: 'Already reviewed this transaction' });
    }

    const id = uuidv4();
    const review = await reviewRepository.createReview({
      id,
      transactionId: transaction_id,
      reviewerId: reviewer_id,
      revieweeId: reviewee_id,
      rating,
      comment
    });

    res.status(201).json({ review });
  } catch (error) {
    next(error);
  }
};

export const getReviews = async (req, res, next) => {
  try {
    const { reviewee_id, page = 1, limit = 20 } = req.query;

    const result = await reviewRepository.findReviews({
      revieweeId: reviewee_id,
      page,
      limit
    });

    res.json({
      reviews: result.reviews,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await reviewRepository.findReviewById(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ review });
  } catch (error) {
    next(error);
  }
};
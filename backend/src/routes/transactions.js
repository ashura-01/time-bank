import express from 'express';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransactionStatus,
  getLedger
} from '../controllers/transactionController.js';
import { authenticate } from '../middleware/auth.js';
import {
  createTransactionValidation,
  updateTransactionValidation,
  getTransactionsValidation
} from '../validators/transactions.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getTransactionsValidation, validate, getTransactions);
router.get('/ledger', getLedger);
router.get('/:id', getTransactionById);
router.post('/', createTransactionValidation, validate, createTransaction);
router.put('/:id', updateTransactionValidation, validate, updateTransactionStatus);

export default router;
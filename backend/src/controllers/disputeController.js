import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';
import { disputeRepository } from '../repositories/disputeRepository.js';
import { transactionRepository } from '../repositories/transactionRepository.js';
import { Dispute, Transaction } from '../models/index.js';

export const createDispute = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { transaction_id, reason, evidence } = req.body;
    const raised_by = req.user.id;

    const rawTx = await transactionRepository.findRawTransactionById(connection, transaction_id);
    if (!rawTx) {
      await connection.rollback();
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const tx = new Transaction(rawTx);
    if (!tx.isParticipant(raised_by)) {
      await connection.rollback();
      return res.status(403).json({ error: 'Not part of this transaction' });
    }

    if (tx.status === Transaction.Status.CANCELLED) {
      await connection.rollback();
      return res.status(400).json({ error: 'Cannot dispute cancelled transaction' });
    }

    const existing = await disputeRepository.findActiveDisputeForTransaction(transaction_id, connection);
    if (existing) {
      await connection.rollback();
      return res.status(409).json({ error: 'Dispute already exists for this transaction' });
    }

    const id = uuidv4();
    const dispute = await disputeRepository.createDispute(connection, {
      id,
      transactionId: transaction_id,
      raisedBy: raised_by,
      reason,
      evidence
    });

    await connection.commit();
    res.status(201).json({ dispute });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

export const getDisputes = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const result = await disputeRepository.findDisputes({
      userId,
      isAdmin,
      status,
      page,
      limit
    });

    res.json({
      disputes: result.disputes,
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

export const getDisputeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const rawDispute = await disputeRepository.findDisputeById(id);
    if (!rawDispute) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    const dispute = new Dispute(rawDispute);
    if (!dispute.canView(userId, role)) {
      return res.status(403).json({ error: 'Not authorized to view this dispute' });
    }

    res.json({ dispute: rawDispute });
  } catch (error) {
    next(error);
  }
};

export const resolveDispute = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { resolution, status } = req.body;
    const userId = req.user.id;

    if (req.user.role !== 'admin') {
      await connection.rollback();
      return res.status(403).json({ error: 'Admin only' });
    }

    const dispute = await disputeRepository.findRawDisputeById(connection, id);
    if (!dispute) {
      await connection.rollback();
      return res.status(404).json({ error: 'Dispute not found' });
    }

    const updated = await disputeRepository.resolveDispute(connection, {
      id,
      resolution,
      status,
      adminUserId: userId,
      transactionId: dispute.transaction_id
    });

    await connection.commit();
    res.json({ dispute: updated });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};
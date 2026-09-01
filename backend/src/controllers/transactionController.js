import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';
import { transactionRepository } from '../repositories/transactionRepository.js';
import { serviceRepository } from '../repositories/serviceRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { Transaction, Service, User } from '../models/index.js';

export const createTransaction = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { service_id, hours_exchanged, scheduled_at, location, is_remote } = req.body;
    const requester_id = req.user.id;

    const rawService = await serviceRepository.findRawServiceById(service_id, connection);
    if (!rawService) {
      await connection.rollback();
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = new Service(rawService);

    if (service.provider_id === requester_id) {
      await connection.rollback();
      return res.status(400).json({ error: 'Cannot transact with your own service' });
    }

    if (!service.isAvailable()) {
      await connection.rollback();
      return res.status(400).json({ error: 'Service not available' });
    }

    // Hold balance in escrow for offers to eliminate overdraft race conditions
    if (service.isOffer()) {
      const held = await transactionRepository.holdBalance(connection, requester_id, hours_exchanged);
      if (!held) {
        await connection.rollback();
        return res.status(400).json({ error: 'Insufficient time balance' });
      }
    }

    const transactionId = uuidv4();
    await transactionRepository.createTransaction(connection, {
      id: transactionId,
      serviceId: service_id,
      requesterId: requester_id,
      providerId: service.provider_id,
      hoursExchanged: hours_exchanged,
      scheduledAt: scheduled_at,
      location,
      isRemote: is_remote
    });

    await connection.commit();

    const transaction = await transactionRepository.findTransactionById(transactionId);
    res.status(201).json({ transaction });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    const result = await transactionRepository.findTransactions({
      userId,
      status,
      page,
      limit
    });

    res.json({
      transactions: result.transactions,
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

export const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const transaction = await transactionRepository.findTransactionById(id, userId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error) {
    next(error);
  }
};

export const updateTransactionStatus = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { status, scheduled_at, location, is_remote } = req.body;
    const userId = req.user.id;

    const rawTx = await transactionRepository.findRawTransactionById(connection, id);
    if (!rawTx) {
      await connection.rollback();
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const tx = new Transaction(rawTx);

    if (status === Transaction.Status.COMPLETED) {
      return await handleCompletionConfirmation(connection, res, rawTx, userId);
    }

    const requiredFromStatus = {
      [Transaction.Status.CONFIRMED]: Transaction.Status.PENDING,
      [Transaction.Status.CANCELLED]: tx.status,
    };

    // Only provider can confirm, both (or admin) can cancel
    if (status === Transaction.Status.CONFIRMED && !tx.canConfirm(userId)) {
      await connection.rollback();
      return res.status(403).json({ error: 'Only provider can confirm' });
    }
    if (status === Transaction.Status.CANCELLED) {
      if (!tx.canCancel(userId, req.user.role)) {
        await connection.rollback();
        return res.status(403).json({ error: 'Not authorized' });
      }
      if (tx.status === Transaction.Status.COMPLETED) {
        await connection.rollback();
        return res.status(400).json({ error: 'Cannot cancel completed transaction' });
      }

      // Release held balance if offer was in pending or confirmed state
      const rawService = await serviceRepository.findRawServiceById(tx.service_id, connection);
      if (rawService && rawService.type === 'offer' && (tx.status === Transaction.Status.PENDING || tx.status === Transaction.Status.CONFIRMED)) {
        const released = await transactionRepository.releaseHeldBalance(connection, tx.requester_id, tx.hours_exchanged);
        if (!released) {
          await connection.rollback();
          return res.status(400).json({ error: 'Failed to release held escrow balance' });
        }
      }
    }

    const fromStatus = requiredFromStatus[status] ?? tx.status;
    const updated = await transactionRepository.updateStatusWithCAS(
      connection,
      id,
      status,
      fromStatus,
      { scheduled_at, location, is_remote }
    );

    if (!updated) {
      await connection.rollback();
      return res.status(409).json({ error: 'Transaction was already updated by someone else — refresh and try again' });
    }

    await connection.commit();

    const updatedTx = await transactionRepository.findTransactionById(id);
    res.json({ transaction: updatedTx });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

async function handleCompletionConfirmation(connection, res, rawTx, userId) {
  const tx = new Transaction(rawTx);
  const { id } = tx;

  if (!tx.isParticipant(userId)) {
    await connection.rollback();
    return res.status(403).json({ error: 'Not authorized' });
  }
  if (tx.status !== Transaction.Status.CONFIRMED) {
    await connection.rollback();
    return res.status(400).json({ error: 'Transaction must be confirmed first' });
  }

  if (tx.hasUserCompleted(userId)) {
    await connection.rollback();
    return res.status(400).json({ error: "You've already marked this complete — waiting on the other party" });
  }

  const myColumn = tx.getCompletionColumn(userId);
  const marked = await transactionRepository.markCompletionParty(connection, id, myColumn);
  if (!marked) {
    await connection.rollback();
    return res.status(409).json({ error: 'Transaction was already updated — refresh and try again' });
  }

  const freshRaw = await transactionRepository.findRawTransactionById(connection, id);
  const freshTx = new Transaction(freshRaw);

  if (!freshTx.isDualConfirmed()) {
    await connection.commit();
    const updated = await transactionRepository.findTransactionById(id);
    return res.json({
      transaction: updated,
      message: 'Marked complete on your side — waiting for the other party to confirm.'
    });
  }

  const hours = tx.hours_exchanged;
  const rawService = await serviceRepository.findRawServiceById(tx.service_id, connection);
  const service = new Service(rawService);

  const { payerId, payeeId, isOffer } = tx.getParties(service.type);

  const settlement = await transactionRepository.finalizeSettlement(connection, {
    transactionId: id,
    serviceId: tx.service_id,
    payerId,
    payeeId,
    hours,
    isOffer
  });

  if (!settlement.success) {
    await connection.rollback();
    if (settlement.reason === 'concurrency_conflict') {
      return res.status(409).json({ error: 'Transaction was already updated — refresh and try again' });
    }
    return res.status(400).json({ error: 'Insufficient time balance to complete this transaction' });
  }

  await connection.commit();

  const updated = await transactionRepository.findTransactionById(id);
  res.json({ transaction: updated });
}

export const getLedger = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    const result = await transactionRepository.getLedgerEntries({
      userId,
      page,
      limit
    });

    res.json({
      entries: result.entries,
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
import {
  analyticsRepository,
  userRepository,
  serviceRepository,
  transactionRepository
} from '../repositories/index.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const statsData = await analyticsRepository.getDashboardStats();
    res.json(statsData);
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, is_active } = req.query;

    const result = await userRepository.findAllUsers({
      page,
      limit,
      search,
      role,
      is_active
    });

    res.json({
      users: result.users,
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

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, is_active, time_balance } = req.body;

    const user = await userRepository.updateUserAdmin(id, { role, is_active, time_balance });
    if (!user) {
      return res.status(404).json({ error: 'User not found or no fields to update' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const deleted = await userRepository.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAllServices = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const result = await serviceRepository.findAllServicesAdmin({
      page,
      limit,
      status,
      search
    });

    res.json({
      services: result.services,
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

export const updateServiceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const service = await serviceRepository.updateServiceStatusAdmin(id, status);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ service });
  } catch (error) {
    next(error);
  }
};

export const getAllTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const result = await transactionRepository.findAllTransactionsAdmin({
      page,
      limit,
      status
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

export const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsRepository.getAnalytics();
    res.json(analytics);
  } catch (error) {
    next(error);
  }
};

export const getUserReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const report = await analyticsRepository.getUserReport(id);
    if (!report) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const getUserInsight = async (req, res, next) => {
  try {
    const { type } = req.params;
    const rows = await analyticsRepository.getUserInsights(type);

    if (rows === null) {
      return res.status(400).json({ error: 'Unknown insight type' });
    }

    res.json({ type, users: rows, count: rows.length });
  } catch (error) {
    next(error);
  }
};

export const getServiceInsight = async (req, res, next) => {
  try {
    const { type } = req.params;
    const rows = await analyticsRepository.getServiceInsights(type);

    if (rows === null) {
      return res.status(400).json({ error: 'Unknown insight type' });
    }

    res.json({ type, services: rows, count: rows.length });
  } catch (error) {
    next(error);
  }
};
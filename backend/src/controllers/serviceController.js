import { v4 as uuidv4 } from 'uuid';
import { serviceRepository } from '../repositories/serviceRepository.js';
import { Service } from '../models/index.js';

export const createService = async (req, res, next) => {
  try {
    const { category_id, title, description, type, duration_hours, location, is_remote, tags } = req.body;
    const provider_id = req.user.id;

    const category = await serviceRepository.findCategoryById(category_id);
    if (!category) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const id = uuidv4();
    const service = await serviceRepository.createService({
      id,
      providerId: provider_id,
      categoryId: category_id,
      title,
      description,
      type,
      durationHours: duration_hours,
      location,
      isRemote: is_remote,
      tags
    });

    res.status(201).json({ service });
  } catch (error) {
    next(error);
  }
};

export const getServices = async (req, res, next) => {
  try {
    const { category_id, type, provider_id, search, page = 1, limit = 12, sort = 'newest' } = req.query;

    const result = await serviceRepository.findServices({
      categoryId: category_id,
      type,
      providerId: provider_id,
      search,
      page,
      limit,
      sort
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

export const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await serviceRepository.findServiceById(id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ service });
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, duration_hours, location, is_remote, status, tags } = req.body;
    const userId = req.user.id;

    const rawService = await serviceRepository.findRawServiceById(id);
    if (!rawService) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = new Service(rawService);
    if (!service.canModify(userId, req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to update this service' });
    }

    const updated = await serviceRepository.updateService(id, {
      title,
      description,
      duration_hours,
      location,
      is_remote,
      status
    }, tags);

    res.json({ service: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const rawService = await serviceRepository.findRawServiceById(id);
    if (!rawService) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = new Service(rawService);
    if (!service.canModify(userId, req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to delete this service' });
    }

    await serviceRepository.deleteService(id);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = await serviceRepository.findCategories();
    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, color } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const id = uuidv4();
    const category = await serviceRepository.createCategory({
      id,
      name,
      description,
      icon,
      color
    });

    res.status(201).json({ category });
  } catch (error) {
    next(error);
  }
};
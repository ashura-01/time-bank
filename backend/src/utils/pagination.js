export const getPaginationParams = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

export const formatPaginatedResponse = (data, total, page, limit) => {
  const parsedLimit = parseInt(limit, 10) || 20;
  const parsedPage = parseInt(page, 10) || 1;
  const parsedTotal = parseInt(total, 10) || 0;

  return {
    items: data,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total: parsedTotal,
      pages: Math.ceil(parsedTotal / parsedLimit) || 1
    }
  };
};

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear local user but DON'T redirect here
      // Let ProtectedRoute/PublicRoute handle navigation to avoid reload loops
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data)
};

export const servicesAPI = {
  getAll: (params) => api.get('/services', { params }),
  getById: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
  getCategories: () => api.get('/services/categories'),
  createCategory: (data) => api.post('/services/categories', data)
};

export const transactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  updateStatus: (id, data) => api.put(`/transactions/${id}`, data),
  getLedger: (params) => api.get('/transactions/ledger', { params })
};

export const reviewsAPI = {
  getAll: (params) => api.get('/reviews', { params }),
  getById: (id) => api.get(`/reviews/${id}`),
  create: (data) => api.post('/reviews', data)
};

export const disputesAPI = {
  getAll: (params) => api.get('/disputes', { params }),
  getById: (id) => api.get(`/disputes/${id}`),
  create: (data) => api.post('/disputes', data),
  resolve: (id, data) => api.put(`/disputes/${id}/resolve`, data)
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getServices: (params) => api.get('/admin/services', { params }),
  updateServiceStatus: (id, data) => api.put(`/admin/services/${id}/status`, data),
  getTransactions: (params) => api.get('/admin/transactions', { params })
};

export default api;
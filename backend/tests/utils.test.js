import { getPaginationParams, formatPaginatedResponse } from '../src/utils/pagination.js';
import { generateToken } from '../src/utils/auth.js';
import jwt from 'jsonwebtoken';

describe('Backend Utils Test Suite', () => {
  describe('Pagination Utils', () => {
    it('should extract and bound pagination parameters safely', () => {
      expect(getPaginationParams({ page: '1', limit: '20' })).toEqual({ page: 1, limit: 20, offset: 0 });
      expect(getPaginationParams({ page: '3', limit: '10' })).toEqual({ page: 3, limit: 10, offset: 20 });
      expect(getPaginationParams({ page: '-5', limit: '500' })).toEqual({ page: 1, limit: 100, offset: 0 });
      expect(getPaginationParams({})).toEqual({ page: 1, limit: 20, offset: 0 });
    });

    it('should format paginated response objects with page count math', () => {
      const res = formatPaginatedResponse(['item1', 'item2'], 25, 2, 10);
      expect(res.items).toHaveLength(2);
      expect(res.pagination.total).toBe(25);
      expect(res.pagination.pages).toBe(3);
      expect(res.pagination.page).toBe(2);
      expect(res.pagination.limit).toBe(10);
    });
  });

  describe('Auth Utils', () => {
    it('should generate a signed JWT with userId payload', () => {
      process.env.JWT_SECRET = 'test-secret';
      const token = generateToken('user-123');
      expect(typeof token).toBe('string');
      const decoded = jwt.verify(token, 'test-secret');
      expect(decoded.userId).toBe('user-123');
    });
  });
});

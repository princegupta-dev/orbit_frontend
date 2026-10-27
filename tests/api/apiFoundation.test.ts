import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ApiError,
  tokenManager,
  cleanQueryParams,
  toQueryString,
  extractList,
  extractEntity,
  interpolateUrl,
} from '@/api';

describe('API Foundation Architecture', () => {
  beforeEach(() => {
    tokenManager.clearTokens();
    localStorage.clear();
  });

  describe('tokenManager', () => {
    it('manages access and refresh tokens correctly', () => {
      expect(tokenManager.hasTokens()).toBe(false);
      expect(tokenManager.getAccessToken()).toBeNull();
      expect(tokenManager.getRefreshToken()).toBeNull();

      tokenManager.setTokens({
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
      });

      expect(tokenManager.hasTokens()).toBe(true);
      expect(tokenManager.getAccessToken()).toBe('mock_access_token');
      expect(tokenManager.getRefreshToken()).toBe('mock_refresh_token');

      tokenManager.clearTokens();
      expect(tokenManager.hasTokens()).toBe(false);
      expect(tokenManager.getAccessToken()).toBeNull();
      expect(tokenManager.getRefreshToken()).toBeNull();
    });

    it('notifies subscribers on token changes', () => {
      const listener = vi.fn();
      const unsubscribe = tokenManager.subscribe(listener);

      tokenManager.setTokens({ accessToken: 'token123' });
      expect(listener).toHaveBeenCalledWith(true);

      tokenManager.clearTokens();
      expect(listener).toHaveBeenCalledWith(false);

      unsubscribe();
      tokenManager.setTokens({ accessToken: 'token456' });
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe('ApiError', () => {
    it('normalizes network errors when status is 0', () => {
      const error = new ApiError({ message: 'Network failed', status: 0 });
      expect(error.isNetworkError).toBe(true);
      expect(error.isValidationError).toBe(false);
      expect(error.isUnauthorized).toBe(false);
      expect(error.status).toBe(0);
    });

    it('identifies validation errors and extracts field errors', () => {
      const error = new ApiError({
        message: 'Validation failed',
        status: 400,
        errors: [
          { field: 'email', message: 'Invalid email address' },
          { field: 'password', message: 'Too short' },
        ],
      });

      expect(error.isValidationError).toBe(true);
      expect(error.getFieldError('email')).toBe('Invalid email address');
      expect(error.getFieldError('password')).toBe('Too short');
      expect(error.getFieldError('nonexistent')).toBeUndefined();
    });

    it('identifies HTTP 401 unauthorized errors', () => {
      const error = new ApiError({ message: 'Unauthorized', status: 401 });
      expect(error.isUnauthorized).toBe(true);
      expect(error.isForbidden).toBe(false);
    });

    it('identifies HTTP 403 forbidden and HTTP 404 not found errors', () => {
      const error403 = new ApiError({ message: 'Forbidden', status: 403 });
      expect(error403.isForbidden).toBe(true);

      const error404 = new ApiError({ message: 'Not found', status: 404 });
      expect(error404.isNotFound).toBe(true);
    });
  });

  describe('Query Parameter Utilities', () => {
    it('cleans undefined, null, and empty string parameters', () => {
      const cleaned = cleanQueryParams({
        page: 1,
        limit: 10,
        search: '',
        filter: undefined,
        status: null,
        active: true,
      });

      expect(cleaned).toEqual({
        page: '1',
        limit: '10',
        active: 'true',
      });
    });

    it('serializes array parameters into comma-separated values', () => {
      const cleaned = cleanQueryParams({
        tags: ['work', 'urgent'],
        emptyArray: [],
      });

      expect(cleaned).toEqual({
        tags: 'work,urgent',
      });
    });

    it('formats a query string with leading question mark', () => {
      const queryString = toQueryString({ page: 2, limit: 20 });
      expect(queryString).toBe('?page=2&limit=20');

      expect(toQueryString({})).toBe('');
      expect(toQueryString(undefined)).toBe('');
    });
  });

  describe('Response Parser Utilities', () => {
    it('extracts arrays from direct, paginated, and named wrappers', () => {
      expect(extractList([1, 2, 3])).toEqual([1, 2, 3]);
      expect(extractList({ data: [4, 5, 6] })).toEqual([4, 5, 6]);
      expect(extractList({ items: [7, 8] }, 'items')).toEqual([7, 8]);
      expect(extractList(null)).toEqual([]);
    });

    it('extracts entities safely', () => {
      const entity = { id: 'abc', title: 'Task' };
      expect(extractEntity(entity)).toEqual(entity);
      expect(extractEntity({ data: entity })).toEqual(entity);
      expect(extractEntity({ task: entity }, 'task')).toEqual(entity);
    });
  });

  describe('interpolateUrl', () => {
    it('interpolates route parameters accurately', () => {
      const url = interpolateUrl('/users/:userId/items/:itemId', {
        userId: 'u123',
        itemId: 456,
      });
      expect(url).toBe('/users/u123/items/456');
    });
  });
});

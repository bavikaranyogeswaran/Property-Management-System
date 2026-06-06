import { describe, it, expect, vi, beforeEach } from 'vitest';
import cacheService from '../../services/cacheService.js';
import redis from '../../config/redis.js';

// Mock Redis
vi.mock('../../config/redis.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

describe('CacheService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrSet', () => {
    it('should return cached data if available', async () => {
      const mockData = { id: 1, name: 'Test' };
      redis.get.mockResolvedValueOnce(JSON.stringify(mockData));
      
      const fetchFn = vi.fn();
      const result = await cacheService.getOrSet('test-key', fetchFn);

      expect(redis.get).toHaveBeenCalledWith('test-key');
      expect(fetchFn).not.toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('should call fetchFn and cache result if cache miss', async () => {
      redis.get.mockResolvedValueOnce(null);
      const mockData = { id: 1, name: 'New Data' };
      const fetchFn = vi.fn().mockResolvedValue(mockData);
      
      const result = await cacheService.getOrSet('test-key', fetchFn, 60);

      expect(redis.get).toHaveBeenCalledWith('test-key');
      expect(fetchFn).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalledWith('test-key', JSON.stringify(mockData), 'EX', 60);
      expect(result).toEqual(mockData);
    });

    it('should fall back to fetchFn if Redis throws an error', async () => {
      redis.get.mockRejectedValueOnce(new Error('Redis is down'));
      const mockData = { id: 1, name: 'Fallback Data' };
      const fetchFn = vi.fn().mockResolvedValue(mockData);
      
      const result = await cacheService.getOrSet('test-key', fetchFn);

      expect(fetchFn).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe('invalidate', () => {
    it('should call redis.del', async () => {
      await cacheService.invalidate('test-key');
      expect(redis.del).toHaveBeenCalledWith('test-key');
    });
  });
});

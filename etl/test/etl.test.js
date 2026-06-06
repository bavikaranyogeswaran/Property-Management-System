import { describe, it, expect, vi, beforeEach } from 'vitest';
import mysql from 'mysql2/promise';
import pkg from 'pg';
import fs from 'fs';
import { runETL } from '../index.js';

// Mock dependencies
vi.mock('mysql2/promise', () => ({
  default: {
    createConnection: vi.fn(),
  },
}));

vi.mock('pg', () => {
  return {
    default: {
      Client: class {
        connect = vi.fn();
        query = vi.fn();
        end = vi.fn();
      }
    }
  };
});

vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(),
  },
}));

vi.mock('pg-format', () => ({
  default: vi.fn((query) => query),
}));

describe('ETL Process', () => {
  let mockMysqlConn;
  let mockPgClient;

  beforeEach(() => {
    vi.clearAllMocks();

    mockMysqlConn = {
      query: vi.fn().mockResolvedValue([[]]), // Default empty results
      end: vi.fn(),
    };
    mysql.createConnection.mockResolvedValue(mockMysqlConn);

    fs.readFileSync.mockReturnValue('mock schema sql');
  });

  it('should successfully run ETL process', async () => {
    // Provide some mock data for the first query to ensure coverage
    mockMysqlConn.query.mockResolvedValueOnce([[{
      property_id: 1,
      name: 'Test Property',
      type: 'Apartment',
      city: 'Test City',
      district: 'Test District',
      status: 'active',
      management_fee_percentage: 5.0
    }]]);

    await runETL();

    expect(mysql.createConnection).toHaveBeenCalled();
    expect(mockMysqlConn.query).toHaveBeenCalledTimes(6); // 6 queries for the 6 facts/dims
    expect(mockMysqlConn.end).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    mysql.createConnection.mockRejectedValue(new Error('DB Connection Failed'));

    // Should not throw, should log error
    await runETL();

    expect(mysql.createConnection).toHaveBeenCalled();
  });
});

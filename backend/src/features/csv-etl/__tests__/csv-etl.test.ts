import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processCsvFile, createColumnDefinitions } from '../csv-etl';
import { Result, ok } from '../../../core/utils/result';
import { CsvRow } from '../../../core/utils/csv';
import { Connection } from 'mysql2/promise';

describe('CSV ETL', () => {
  describe('createColumnDefinitions', () => {
    it('should create column definitions from CSV header', () => {
      // Arrange
      const sampleRow: CsvRow = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        age: '30',
      };

      // Act
      const result = createColumnDefinitions(sampleRow);

      // Assert
      expect(result).toEqual({
        id: 'VARCHAR(255)',
        name: 'VARCHAR(255)',
        email: 'VARCHAR(255)',
        age: 'VARCHAR(255)',
      });
    });

    it('should handle empty row', () => {
      // Arrange
      const sampleRow: CsvRow = {};

      // Act
      const result = createColumnDefinitions(sampleRow);

      // Assert
      expect(result).toEqual({});
    });
  });

  describe('processCsvFile', () => {
    it('should process CSV file successfully', async () => {
      // Arrange
      const mockBuffer = Buffer.from('id,name,email\n1,Test User,test@example.com');
      const mockRows: CsvRow[] = [
        { id: '1', name: 'Test User', email: 'test@example.com' },
      ];
      
      const mockS3 = {
        getObject: vi.fn().mockResolvedValue(ok(mockBuffer)),
      };
      
      const mockCsv = {
        parseCsvBuffer: vi.fn().mockResolvedValue(ok(mockRows)),
      };
      
      const mockConnection = {
        end: vi.fn().mockResolvedValue(undefined),
      } as unknown as Connection;
      
      const mockDb = {
        getCredentials: vi.fn().mockResolvedValue(ok({
          username: 'user',
          password: 'pass',
          host: 'localhost',
          port: 3306,
        })),
        createConnection: vi.fn().mockResolvedValue(ok(mockConnection)),
        createTableIfNotExists: vi.fn().mockResolvedValue(ok(undefined)),
        insertBatch: vi.fn().mockResolvedValue(ok(1)),
      };

      const params = {
        bucket: 'test-bucket',
        key: 'csv/users.csv',
      };

      const deps = {
        s3: mockS3 as any,
        db: mockDb as any,
        csv: mockCsv as any,
        dbSecretArn: 'test-secret-arn',
        dbName: 'test-db',
      };

      // Act
      const result = await processCsvFile(params, deps);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({
          tableName: 'users',
          rowsProcessed: 1,
        });
      }
      
      expect(mockS3.getObject).toHaveBeenCalledWith('csv/users.csv');
      expect(mockCsv.parseCsvBuffer).toHaveBeenCalledWith(mockBuffer);
      expect(mockDb.getCredentials).toHaveBeenCalledWith('test-secret-arn');
      expect(mockDb.createConnection).toHaveBeenCalled();
      expect(mockDb.createTableIfNotExists).toHaveBeenCalledWith(
        mockConnection,
        {
          tableName: 'users',
          columns: {
            id: 'VARCHAR(255)',
            name: 'VARCHAR(255)',
            email: 'VARCHAR(255)',
          },
        }
      );
      expect(mockDb.insertBatch).toHaveBeenCalledWith(
        mockConnection,
        {
          tableName: 'users',
          rows: mockRows,
        }
      );
      expect(mockConnection.end).toHaveBeenCalled();
    });

    it('should handle empty CSV file', async () => {
      // Arrange
      const mockBuffer = Buffer.from('id,name,email');
      const mockRows: CsvRow[] = [];
      
      const mockS3 = {
        getObject: vi.fn().mockResolvedValue(ok(mockBuffer)),
      };
      
      const mockCsv = {
        parseCsvBuffer: vi.fn().mockResolvedValue(ok(mockRows)),
      };

      const params = {
        bucket: 'test-bucket',
        key: 'csv/users.csv',
      };

      const deps = {
        s3: mockS3 as any,
        db: {} as any,
        csv: mockCsv as any,
        dbSecretArn: 'test-secret-arn',
        dbName: 'test-db',
      };

      // Act
      const result = await processCsvFile(params, deps);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({
          tableName: 'users',
          rowsProcessed: 0,
        });
      }
      
      expect(mockS3.getObject).toHaveBeenCalledWith('csv/users.csv');
      expect(mockCsv.parseCsvBuffer).toHaveBeenCalledWith(mockBuffer);
    });
  });
});

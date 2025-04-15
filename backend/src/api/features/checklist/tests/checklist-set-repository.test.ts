/**
 * チェックリストセットリポジトリのテスト
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ChecklistSetRepository } from '../repositories/checklist-set-repository';

// モックPrismaClient
const mockPrismaClient = {
  checkListSet: {
    findMany: vi.fn(),
    count: vi.fn()
  },
  $transaction: vi.fn((callback) => callback(mockPrismaClient))
};

describe('ChecklistSetRepository', () => {
  let repository: ChecklistSetRepository;

  beforeEach(() => {
    // テスト前にモックをリセット
    vi.resetAllMocks();
    
    // モックを使用してリポジトリをインスタンス化
    repository = new ChecklistSetRepository(mockPrismaClient as any);
  });

  describe('getChecklistSets', () => {
    it('チェックリストセット一覧を取得する', async () => {
      // モックの戻り値を設定
      const mockChecklistSets = [
        {
          id: 'test-id-1',
          name: 'テストチェックリスト1',
          description: 'テスト説明1',
          documents: []
        }
      ];
      mockPrismaClient.checkListSet.findMany.mockResolvedValue(mockChecklistSets);

      // テスト対象メソッドを実行
      const result = await repository.getChecklistSets({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });

      // 期待する結果を検証
      expect(result).toEqual(mockChecklistSets);
      expect(mockPrismaClient.checkListSet.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          documents: true
        }
      });
    });
  });

  describe('getChecklistSetsCount', () => {
    it('チェックリストセットの総数を取得する', async () => {
      // モックの戻り値を設定
      mockPrismaClient.checkListSet.count.mockResolvedValue(5);

      // テスト対象メソッドを実行
      const result = await repository.getChecklistSetsCount();

      // 期待する結果を検証
      expect(result).toBe(5);
      expect(mockPrismaClient.checkListSet.count).toHaveBeenCalled();
    });
  });
});

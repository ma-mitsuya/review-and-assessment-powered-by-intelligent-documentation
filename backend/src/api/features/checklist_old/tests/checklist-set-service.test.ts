/**
 * チェックリストセットサービスのテスト
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChecklistSetService } from '../services/checklist-set-service';
import { ChecklistSetRepository } from '../repositories/checklist-set-repository';

// リポジトリのモック
const mockGetChecklistSets = vi.fn().mockResolvedValue([
  {
    id: 'test-id-1',
    name: 'テストチェックリスト1',
    description: 'テスト説明1',
    documents: [
      { id: 'doc-1', status: 'pending' }
    ]
  },
  {
    id: 'test-id-2',
    name: 'テストチェックリスト2',
    description: 'テスト説明2',
    documents: [
      { id: 'doc-2', status: 'completed' },
      { id: 'doc-3', status: 'completed' }
    ]
  },
  {
    id: 'test-id-3',
    name: 'テストチェックリスト3',
    description: 'テスト説明3',
    documents: [
      { id: 'doc-4', status: 'processing' },
      { id: 'doc-5', status: 'completed' }
    ]
  }
]);

const mockGetChecklistSetsCount = vi.fn().mockResolvedValue(3);

// モック
vi.mock('../repositories/checklist-set-repository', () => {
  return {
    ChecklistSetRepository: vi.fn().mockImplementation(() => ({
      getChecklistSets: mockGetChecklistSets,
      getChecklistSetsCount: mockGetChecklistSetsCount
    }))
  };
});

describe('ChecklistSetService', () => {
  let service: ChecklistSetService;

  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();
    service = new ChecklistSetService();
  });

  describe('getChecklistSets', () => {
    it('チェックリストセット一覧を取得し、処理状態を計算する', async () => {
      const result = await service.getChecklistSets({
        page: 1,
        limit: 10
      });

      expect(result.checkListSets).toHaveLength(3);
      expect(result.total).toBe(3);
      
      // 処理状態の検証
      expect(result.checkListSets[0].processing_status).toBe('pending');
      expect(result.checkListSets[1].processing_status).toBe('completed');
      expect(result.checkListSets[2].processing_status).toBe('in_progress');
    });

    it('ページネーションとソートのパラメータを正しく処理する', async () => {
      await service.getChecklistSets({
        page: 2,
        limit: 5,
        sortBy: 'name',
        sortOrder: 'desc'
      });

      // リポジトリのメソッドが正しいパラメータで呼ばれたことを検証
      expect(mockGetChecklistSets).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
        orderBy: { name: 'desc' }
      });
    });
  });
});

/**
 * チェックリストセットサービスのテスト
 */
import { describe, it, expect, vi } from 'vitest';
import { ChecklistSetService } from '../services/checklist-set-service';

describe('ChecklistSetService', () => {
  describe('createChecklistSet', () => {
    it('チェックリストセットを作成できること', async () => {
      // モックデータ
      const mockResult = {
        id: 'MOCK_ID',
        name: 'テストチェックリスト',
        description: 'テスト用の説明'
      };

      // リポジトリのモック
      const mockCreateChecklistSet = vi.fn().mockResolvedValue(mockResult);
      const MockRepository = vi.fn().mockImplementation(() => ({
        createChecklistSet: mockCreateChecklistSet
      }));

      // サービスの作成（モックリポジトリを注入）
      const service = new ChecklistSetService(new MockRepository());

      const params = {
        name: 'テストチェックリスト',
        description: 'テスト用の説明',
        documentIds: []
      };

      const result = await service.createChecklistSet(params);

      expect(result).toEqual(mockResult);
      expect(mockCreateChecklistSet).toHaveBeenCalledWith(params);
    });
  });
});

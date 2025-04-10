/**
 * チェックリストセットサービスのテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckListSetServiceImpl } from '../service';
import { CheckListSetRepository } from '../repository';
import { CheckListSet } from '../types';

// モックデータ
const mockCheckListSets: CheckListSet[] = [
  {
    check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN',
    name: '自社物件チェックリストセット',
    description: '自社物件の契約書チェック用のセット'
  },
  {
    check_list_set_id: '01DAG9M3AQN08QVNFMW6P6MKSG',
    name: '他社物件チェックリストセット',
    description: '他社物件の契約書チェック用のセット'
  }
];

// リポジトリのモック
const mockRepository: CheckListSetRepository = {
  getCheckListSets: vi.fn(),
  countCheckListSets: vi.fn(),
  getCheckListSetById: vi.fn()
};

describe('CheckListSetService', () => {
  let service: CheckListSetServiceImpl;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new CheckListSetServiceImpl(mockRepository);
  });

  describe('getCheckListSets', () => {
    it('チェックリストセットの一覧と総数を取得できること', async () => {
      // モックの設定
      (mockRepository.getCheckListSets as any).mockResolvedValue(mockCheckListSets);
      (mockRepository.countCheckListSets as any).mockResolvedValue(mockCheckListSets.length);

      // テスト対象の実行
      const result = await service.getCheckListSets();

      // 検証
      expect(mockRepository.getCheckListSets).toHaveBeenCalledTimes(1);
      expect(mockRepository.countCheckListSets).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        checkListSets: mockCheckListSets,
        total: mockCheckListSets.length
      });
    });

    it('フィルタリングパラメータを正しく渡せること', async () => {
      // モックの設定
      const params = { page: 2, limit: 5 };
      (mockRepository.getCheckListSets as any).mockResolvedValue(mockCheckListSets);
      (mockRepository.countCheckListSets as any).mockResolvedValue(mockCheckListSets.length);

      // テスト対象の実行
      const result = await service.getCheckListSets(params);

      // 検証
      expect(mockRepository.getCheckListSets).toHaveBeenCalledWith(params);
      expect(mockRepository.countCheckListSets).toHaveBeenCalledWith(params);
      expect(result).toEqual({
        checkListSets: mockCheckListSets,
        total: mockCheckListSets.length
      });
    });
  });

  describe('getCheckListSetById', () => {
    it('IDによるチェックリストセットの取得ができること', async () => {
      // モックの設定
      const id = '01B5NHDV91YF9QKH4JBSQFSBGN';
      (mockRepository.getCheckListSetById as any).mockResolvedValue(mockCheckListSets[0]);

      // テスト対象の実行
      const result = await service.getCheckListSetById(id);

      // 検証
      expect(mockRepository.getCheckListSetById).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockCheckListSets[0]);
    });

    it('存在しないIDの場合はnullを返すこと', async () => {
      // モックの設定
      const id = 'non-existent-id';
      (mockRepository.getCheckListSetById as any).mockResolvedValue(null);

      // テスト対象の実行
      const result = await service.getCheckListSetById(id);

      // 検証
      expect(mockRepository.getCheckListSetById).toHaveBeenCalledWith(id);
      expect(result).toBeNull();
    });
  });
});

/**
 * チェックリストセットサービスのテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckListSetServiceImpl } from '../service';
import { CheckListSetRepository } from '../repository';
import { CheckListSet, CreateCheckListSetRequest, UpdateCheckListSetRequest } from '../types';

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
  getCheckListSetById: vi.fn(),
  createCheckListSet: vi.fn(),
  updateCheckListSet: vi.fn(),
  deleteCheckListSet: vi.fn()
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
  
  describe('createCheckListSet', () => {
    it('チェックリストセットを作成できること', async () => {
      // モックの設定
      const createData: CreateCheckListSetRequest = {
        name: '新規チェックリストセット',
        description: '新規作成のテスト用セット'
      };
      
      const createdSet: CheckListSet = {
        check_list_set_id: '01NEW123456789ABCDEF',
        name: createData.name,
        description: createData.description
      };
      
      (mockRepository.createCheckListSet as any).mockResolvedValue(createdSet);

      // テスト対象の実行
      const result = await service.createCheckListSet(createData);

      // 検証
      expect(mockRepository.createCheckListSet).toHaveBeenCalledWith(createData);
      expect(result).toEqual(createdSet);
    });
    
    it('名前が空の場合はエラーを投げること', async () => {
      // モックの設定
      const createData: CreateCheckListSetRequest = {
        name: '',
        description: '新規作成のテスト用セット'
      };

      // テスト対象の実行と検証
      await expect(service.createCheckListSet(createData)).rejects.toThrow('チェックリストセット名は必須です');
      expect(mockRepository.createCheckListSet).not.toHaveBeenCalled();
    });
  });
  
  describe('updateCheckListSet', () => {
    it('チェックリストセットを更新できること', async () => {
      // モックの設定
      const id = '01B5NHDV91YF9QKH4JBSQFSBGN';
      const updateData: UpdateCheckListSetRequest = {
        name: '更新後のチェックリストセット',
        description: '更新後の説明'
      };
      
      const updatedSet: CheckListSet = {
        check_list_set_id: id,
        name: updateData.name,
        description: updateData.description
      };
      
      (mockRepository.updateCheckListSet as any).mockResolvedValue(updatedSet);

      // テスト対象の実行
      const result = await service.updateCheckListSet(id, updateData);

      // 検証
      expect(mockRepository.updateCheckListSet).toHaveBeenCalledWith(id, updateData);
      expect(result).toEqual(updatedSet);
    });
    
    it('名前が空の場合はエラーを投げること', async () => {
      // モックの設定
      const id = '01B5NHDV91YF9QKH4JBSQFSBGN';
      const updateData: UpdateCheckListSetRequest = {
        name: ''
      };

      // テスト対象の実行と検証
      await expect(service.updateCheckListSet(id, updateData)).rejects.toThrow('チェックリストセット名は空にできません');
      expect(mockRepository.updateCheckListSet).not.toHaveBeenCalled();
    });
    
    it('存在しないIDの場合はnullを返すこと', async () => {
      // モックの設定
      const id = 'non-existent-id';
      const updateData: UpdateCheckListSetRequest = {
        name: '更新後のチェックリストセット'
      };
      
      (mockRepository.updateCheckListSet as any).mockResolvedValue(null);

      // テスト対象の実行
      const result = await service.updateCheckListSet(id, updateData);

      // 検証
      expect(mockRepository.updateCheckListSet).toHaveBeenCalledWith(id, updateData);
      expect(result).toBeNull();
    });
  });
  
  describe('deleteCheckListSet', () => {
    it('チェックリストセットを削除できること', async () => {
      // モックの設定
      const id = '01B5NHDV91YF9QKH4JBSQFSBGN';
      (mockRepository.deleteCheckListSet as any).mockResolvedValue(true);

      // テスト対象の実行
      const result = await service.deleteCheckListSet(id);

      // 検証
      expect(mockRepository.deleteCheckListSet).toHaveBeenCalledWith(id);
      expect(result).toBe(true);
    });
    
    it('存在しないIDの場合はfalseを返すこと', async () => {
      // モックの設定
      const id = 'non-existent-id';
      (mockRepository.deleteCheckListSet as any).mockResolvedValue(false);

      // テスト対象の実行
      const result = await service.deleteCheckListSet(id);

      // 検証
      expect(mockRepository.deleteCheckListSet).toHaveBeenCalledWith(id);
      expect(result).toBe(false);
    });
  });
});

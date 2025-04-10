/**
 * チェックリスト項目サービスのテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckListItemServiceImpl } from '../service';
import { CheckListItemRepository } from '../repository';
import { CheckListItem, CreateCheckListItemRequest, UpdateCheckListItemRequest } from '../types';

// モックデータ
const mockCheckListItems: CheckListItem[] = [
  {
    check_id: '01ITEM1234567890ABC',
    name: 'チェック項目1',
    description: '説明1',
    parent_id: null,
    item_type: 'simple',
    is_conclusion: false,
    check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN'
  },
  {
    check_id: '01ITEM2345678901DEF',
    name: 'チェック項目2',
    description: '説明2',
    parent_id: null,
    item_type: 'flow',
    is_conclusion: false,
    flow_data: { condition: 'test' },
    check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN'
  }
];

// 階層構造のモックデータ
const mockHierarchyItems: CheckListItem[] = [
  {
    check_id: '01ITEM1234567890ABC',
    name: 'チェック項目1',
    description: '説明1',
    parent_id: null,
    item_type: 'simple',
    is_conclusion: false,
    check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN',
    children: [
      {
        check_id: '01ITEM3456789012GHI',
        name: 'チェック項目1-1',
        description: '説明1-1',
        parent_id: '01ITEM1234567890ABC',
        item_type: 'simple',
        is_conclusion: false,
        check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN',
        children: []
      }
    ]
  },
  {
    check_id: '01ITEM2345678901DEF',
    name: 'チェック項目2',
    description: '説明2',
    parent_id: null,
    item_type: 'flow',
    is_conclusion: false,
    flow_data: { condition: 'test' },
    check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN',
    children: []
  }
];

// リポジトリのモック
const mockRepository: CheckListItemRepository = {
  getCheckListItems: vi.fn(),
  countCheckListItems: vi.fn(),
  getCheckListItemById: vi.fn(),
  getCheckListItemsHierarchy: vi.fn(),
  createCheckListItem: vi.fn(),
  updateCheckListItem: vi.fn(),
  deleteCheckListItem: vi.fn()
};

describe('CheckListItemService', () => {
  let service: CheckListItemServiceImpl;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new CheckListItemServiceImpl(mockRepository);
  });

  describe('getCheckListItems', () => {
    it('チェックリスト項目の一覧と総数を取得できること', async () => {
      // モックの設定
      (mockRepository.getCheckListItems as any).mockResolvedValue(mockCheckListItems);
      (mockRepository.countCheckListItems as any).mockResolvedValue(mockCheckListItems.length);

      // テスト対象の実行
      const result = await service.getCheckListItems();

      // 検証
      expect(mockRepository.getCheckListItems).toHaveBeenCalledTimes(1);
      expect(mockRepository.countCheckListItems).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        checkListItems: mockCheckListItems,
        total: mockCheckListItems.length
      });
    });

    it('フィルタリングパラメータを正しく渡せること', async () => {
      // モックの設定
      const params = { 
        page: 2, 
        limit: 5,
        checkListSetId: '01B5NHDV91YF9QKH4JBSQFSBGN',
        itemType: 'simple'
      };
      (mockRepository.getCheckListItems as any).mockResolvedValue([mockCheckListItems[0]]);
      (mockRepository.countCheckListItems as any).mockResolvedValue(1);

      // テスト対象の実行
      const result = await service.getCheckListItems(params);

      // 検証
      expect(mockRepository.getCheckListItems).toHaveBeenCalledWith(params);
      expect(mockRepository.countCheckListItems).toHaveBeenCalledWith(params);
      expect(result).toEqual({
        checkListItems: [mockCheckListItems[0]],
        total: 1
      });
    });
  });

  describe('getCheckListItemById', () => {
    it('IDによるチェックリスト項目の取得ができること', async () => {
      // モックの設定
      const id = '01ITEM1234567890ABC';
      (mockRepository.getCheckListItemById as any).mockResolvedValue(mockCheckListItems[0]);

      // テスト対象の実行
      const result = await service.getCheckListItemById(id);

      // 検証
      expect(mockRepository.getCheckListItemById).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockCheckListItems[0]);
    });

    it('存在しないIDの場合はnullを返すこと', async () => {
      // モックの設定
      const id = 'non-existent-id';
      (mockRepository.getCheckListItemById as any).mockResolvedValue(null);

      // テスト対象の実行
      const result = await service.getCheckListItemById(id);

      // 検証
      expect(mockRepository.getCheckListItemById).toHaveBeenCalledWith(id);
      expect(result).toBeNull();
    });
  });
  
  describe('getCheckListItemsHierarchy', () => {
    it('チェックリスト項目の階層構造を取得できること', async () => {
      // モックの設定
      const checkListSetId = '01B5NHDV91YF9QKH4JBSQFSBGN';
      (mockRepository.getCheckListItemsHierarchy as any).mockResolvedValue(mockHierarchyItems);

      // テスト対象の実行
      const result = await service.getCheckListItemsHierarchy(checkListSetId);

      // 検証
      expect(mockRepository.getCheckListItemsHierarchy).toHaveBeenCalledWith(checkListSetId);
      expect(result).toEqual(mockHierarchyItems);
    });
    
    it('チェックリストセットIDが空の場合はエラーを投げること', async () => {
      // テスト対象の実行と検証
      await expect(service.getCheckListItemsHierarchy('')).rejects.toThrow('チェックリストセットIDは必須です');
      expect(mockRepository.getCheckListItemsHierarchy).not.toHaveBeenCalled();
    });
  });
  
  describe('createCheckListItem', () => {
    it('チェックリスト項目を作成できること', async () => {
      // モックの設定
      const createData: CreateCheckListItemRequest = {
        name: '新規チェック項目',
        description: '新規作成のテスト用項目',
        itemType: 'simple',
        checkListSetId: '01B5NHDV91YF9QKH4JBSQFSBGN'
      };
      
      const createdItem: CheckListItem = {
        check_id: '01NEWITEM123456789',
        name: createData.name,
        description: createData.description || '',
        parent_id: null,
        item_type: 'simple',
        is_conclusion: false,
        check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN'
      };
      
      (mockRepository.createCheckListItem as any).mockResolvedValue(createdItem);

      // テスト対象の実行
      const result = await service.createCheckListItem(createData);

      // 検証
      expect(mockRepository.createCheckListItem).toHaveBeenCalledWith(createData);
      expect(result).toEqual(createdItem);
    });
    
    it('フロー型の場合はフローデータが必要', async () => {
      // モックの設定
      const createData: CreateCheckListItemRequest = {
        name: '新規フロー項目',
        description: '新規作成のテスト用フロー項目',
        itemType: 'flow',
        checkListSetId: '01B5NHDV91YF9QKH4JBSQFSBGN'
        // flowDataがない
      };

      // テスト対象の実行と検証
      await expect(service.createCheckListItem(createData)).rejects.toThrow('フロー型の場合、フローデータは必須です');
      expect(mockRepository.createCheckListItem).not.toHaveBeenCalled();
    });
    
    it('名前が空の場合はエラーを投げること', async () => {
      // モックの設定
      const createData: CreateCheckListItemRequest = {
        name: '',
        itemType: 'simple',
        checkListSetId: '01B5NHDV91YF9QKH4JBSQFSBGN'
      };

      // テスト対象の実行と検証
      await expect(service.createCheckListItem(createData)).rejects.toThrow('チェックリスト項目名は必須です');
      expect(mockRepository.createCheckListItem).not.toHaveBeenCalled();
    });
    
    it('チェックリストセットIDが空の場合はエラーを投げること', async () => {
      // モックの設定
      const createData: CreateCheckListItemRequest = {
        name: '新規チェック項目',
        itemType: 'simple',
        checkListSetId: ''
      };

      // テスト対象の実行と検証
      await expect(service.createCheckListItem(createData)).rejects.toThrow('チェックリストセットIDは必須です');
      expect(mockRepository.createCheckListItem).not.toHaveBeenCalled();
    });
  });
  
  describe('updateCheckListItem', () => {
    it('チェックリスト項目を更新できること', async () => {
      // モックの設定
      const id = '01ITEM1234567890ABC';
      const updateData: UpdateCheckListItemRequest = {
        name: '更新後のチェック項目',
        description: '更新後の説明'
      };
      
      const updatedItem: CheckListItem = {
        check_id: id,
        name: updateData.name || '',
        description: updateData.description || '',
        parent_id: null,
        item_type: 'simple',
        is_conclusion: false,
        check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN'
      };
      
      (mockRepository.updateCheckListItem as any).mockResolvedValue(updatedItem);

      // テスト対象の実行
      const result = await service.updateCheckListItem(id, updateData);

      // 検証
      expect(mockRepository.updateCheckListItem).toHaveBeenCalledWith(id, updateData);
      expect(result).toEqual(updatedItem);
    });
    
    it('名前が空の場合はエラーを投げること', async () => {
      // モックの設定
      const id = '01ITEM1234567890ABC';
      const updateData: UpdateCheckListItemRequest = {
        name: ''
      };

      // テスト対象の実行と検証
      await expect(service.updateCheckListItem(id, updateData)).rejects.toThrow('チェックリスト項目名は空にできません');
      expect(mockRepository.updateCheckListItem).not.toHaveBeenCalled();
    });
    
    it('フロー型に変更する場合はフローデータが必要', async () => {
      // モックの設定
      const id = '01ITEM1234567890ABC';
      const updateData: UpdateCheckListItemRequest = {
        itemType: 'flow'
        // flowDataがない
      };

      // テスト対象の実行と検証
      await expect(service.updateCheckListItem(id, updateData)).rejects.toThrow('フロー型に変更する場合、フローデータは必須です');
      expect(mockRepository.updateCheckListItem).not.toHaveBeenCalled();
    });
    
    it('存在しないIDの場合はnullを返すこと', async () => {
      // モックの設定
      const id = 'non-existent-id';
      const updateData: UpdateCheckListItemRequest = {
        name: '更新後のチェック項目'
      };
      
      (mockRepository.updateCheckListItem as any).mockResolvedValue(null);

      // テスト対象の実行
      const result = await service.updateCheckListItem(id, updateData);

      // 検証
      expect(mockRepository.updateCheckListItem).toHaveBeenCalledWith(id, updateData);
      expect(result).toBeNull();
    });
  });
  
  describe('deleteCheckListItem', () => {
    it('チェックリスト項目を削除できること', async () => {
      // モックの設定
      const id = '01ITEM1234567890ABC';
      (mockRepository.deleteCheckListItem as any).mockResolvedValue(true);

      // テスト対象の実行
      const result = await service.deleteCheckListItem(id);

      // 検証
      expect(mockRepository.deleteCheckListItem).toHaveBeenCalledWith(id);
      expect(result).toBe(true);
    });
    
    it('存在しないIDの場合はfalseを返すこと', async () => {
      // モックの設定
      const id = 'non-existent-id';
      (mockRepository.deleteCheckListItem as any).mockResolvedValue(false);

      // テスト対象の実行
      const result = await service.deleteCheckListItem(id);

      // 検証
      expect(mockRepository.deleteCheckListItem).toHaveBeenCalledWith(id);
      expect(result).toBe(false);
    });
  });
});

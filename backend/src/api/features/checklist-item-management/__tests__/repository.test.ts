/**
 * チェックリスト項目リポジトリのテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaCheckListItemRepository } from '../repository';
import { CreateCheckListItemRequest, UpdateCheckListItemRequest } from '../types';

// ulid モック
vi.mock('ulid', () => ({
  ulid: () => '01MOCKITEM123456789'
}));

// Prismaのモック
vi.mock('@prisma/client', () => {
  const mockFindMany = vi.fn();
  const mockCount = vi.fn();
  const mockFindUnique = vi.fn();
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();

  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      checkList: {
        findMany: mockFindMany,
        count: mockCount,
        findUnique: mockFindUnique,
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete
      }
    }))
  };
});

describe('PrismaCheckListItemRepository', () => {
  let prisma: any;
  let repository: PrismaCheckListItemRepository;

  beforeEach(() => {
    vi.resetAllMocks();
    
    // モックPrismaクライアントの作成
    prisma = {
      checkList: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      }
    };
    
    repository = new PrismaCheckListItemRepository(prisma);
  });

  describe('getCheckListItems', () => {
    it('チェックリスト項目の一覧を取得できること', async () => {
      // モックの設定
      const mockData = [
        {
          id: '01ITEM1234567890ABC',
          name: 'チェック項目1',
          description: '説明1',
          parentId: null,
          itemType: 'simple',
          isConclusion: false,
          flowData: null,
          metaData: null,
          checkListSetId: '01B5NHDV91YF9QKH4JBSQFSBGN'
        },
        {
          id: '01ITEM2345678901DEF',
          name: 'チェック項目2',
          description: '説明2',
          parentId: null,
          itemType: 'flow',
          isConclusion: false,
          flowData: { condition: 'test' },
          metaData: null,
          checkListSetId: '01B5NHDV91YF9QKH4JBSQFSBGN'
        }
      ];
      prisma.checkList.findMany.mockResolvedValue(mockData);

      // テスト対象の実行
      const result = await repository.getCheckListItems();

      // 検証
      expect(prisma.checkList.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: {
          checkListSetId: undefined,
          parentId: undefined,
          itemType: undefined
        },
        orderBy: { name: 'asc' }
      });
      expect(result).toEqual([
        {
          check_id: '01ITEM1234567890ABC',
          name: 'チェック項目1',
          description: '説明1',
          parent_id: null,
          item_type: 'simple',
          is_conclusion: false,
          flow_data: null,
          meta_data: null,
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
          meta_data: null,
          check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN'
        }
      ]);
    });

    it('フィルタリングパラメータを正しく処理できること', async () => {
      // モックの設定
      const mockData = [
        {
          id: '01ITEM1234567890ABC',
          name: 'チェック項目1',
          description: '説明1',
          parentId: null,
          itemType: 'simple',
          isConclusion: false,
          flowData: null,
          metaData: null,
          checkListSetId: '01B5NHDV91YF9QKH4JBSQFSBGN'
        }
      ];
      prisma.checkList.findMany.mockResolvedValue(mockData);

      // テスト対象の実行
      const result = await repository.getCheckListItems({ 
        page: 2, 
        limit: 10,
        checkListSetId: '01B5NHDV91YF9QKH4JBSQFSBGN',
        itemType: 'simple'
      });

      // 検証
      expect(prisma.checkList.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        where: {
          checkListSetId: '01B5NHDV91YF9QKH4JBSQFSBGN',
          parentId: undefined,
          itemType: 'simple'
        },
        orderBy: { name: 'asc' }
      });
      expect(result).toEqual([
        {
          check_id: '01ITEM1234567890ABC',
          name: 'チェック項目1',
          description: '説明1',
          parent_id: null,
          item_type: 'simple',
          is_conclusion: false,
          flow_data: null,
          meta_data: null,
          check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN'
        }
      ]);
    });
  });

  describe('countCheckListItems', () => {
    it('チェックリスト項目の総数を取得できること', async () => {
      // モックの設定
      prisma.checkList.count.mockResolvedValue(2);

      // テスト対象の実行
      const result = await repository.countCheckListItems();

      // 検証
      expect(prisma.checkList.count).toHaveBeenCalledWith({
        where: {
          checkListSetId: undefined,
          parentId: undefined,
          itemType: undefined
        }
      });
      expect(result).toBe(2);
    });
  });

  describe('getCheckListItemById', () => {
    it('IDによるチェックリスト項目の取得ができること', async () => {
      // モックの設定
      const mockData = {
        id: '01ITEM1234567890ABC',
        name: 'チェック項目1',
        description: '説明1',
        parentId: null,
        itemType: 'simple',
        isConclusion: false,
        flowData: null,
        metaData: null,
        checkListSetId: '01B5NHDV91YF9QKH4JBSQFSBGN'
      };
      prisma.checkList.findUnique.mockResolvedValue(mockData);

      // テスト対象の実行
      const result = await repository.getCheckListItemById('01ITEM1234567890ABC');

      // 検証
      expect(prisma.checkList.findUnique).toHaveBeenCalledWith({
        where: { id: '01ITEM1234567890ABC' }
      });
      expect(result).toEqual({
        check_id: '01ITEM1234567890ABC',
        name: 'チェック項目1',
        description: '説明1',
        parent_id: null,
        item_type: 'simple',
        is_conclusion: false,
        flow_data: null,
        meta_data: null,
        check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN'
      });
    });

    it('存在しないIDの場合はnullを返すこと', async () => {
      // モックの設定
      prisma.checkList.findUnique.mockResolvedValue(null);

      // テスト対象の実行
      const result = await repository.getCheckListItemById('non-existent-id');

      // 検証
      expect(prisma.checkList.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' }
      });
      expect(result).toBeNull();
    });
  });
  
  describe('getCheckListItemsHierarchy', () => {
    it('チェックリスト項目の階層構造を取得できること', async () => {
      // モックの設定
      const rootItems = [
        {
          id: '01ITEM1234567890ABC',
          name: 'チェック項目1',
          description: '説明1',
          parentId: null,
          itemType: 'simple',
          isConclusion: false,
          flowData: null,
          metaData: null,
          checkListSetId: '01B5NHDV91YF9QKH4JBSQFSBGN'
        },
        {
          id: '01ITEM2345678901DEF',
          name: 'チェック項目2',
          description: '説明2',
          parentId: null,
          itemType: 'flow',
          isConclusion: false,
          flowData: { condition: 'test' },
          metaData: null,
          checkListSetId: '01B5NHDV91YF9QKH4JBSQFSBGN'
        }
      ];
      
      const childItems = [
        {
          id: '01ITEM3456789012GHI',
          name: 'チェック項目1-1',
          description: '説明1-1',
          parentId: '01ITEM1234567890ABC',
          itemType: 'simple',
          isConclusion: false,
          flowData: null,
          metaData: null,
          checkListSetId: '01B5NHDV91YF9QKH4JBSQFSBGN'
        }
      ];
      
      // 最初のfindManyはルート項目を返す
      prisma.checkList.findMany.mockResolvedValueOnce(rootItems);
      
      // 2回目のfindManyは最初の項目の子項目を返す
      prisma.checkList.findMany.mockResolvedValueOnce(childItems);
      
      // 3回目のfindManyは子項目の子項目（孫項目）を返す（空）
      prisma.checkList.findMany.mockResolvedValueOnce([]);
      
      // 4回目のfindManyは2番目の項目の子項目を返す（空）
      prisma.checkList.findMany.mockResolvedValueOnce([]);

      // テスト対象の実行
      const result = await repository.getCheckListItemsHierarchy('01B5NHDV91YF9QKH4JBSQFSBGN');

      // 検証
      expect(prisma.checkList.findMany).toHaveBeenCalledWith({
        where: {
          checkListSetId: '01B5NHDV91YF9QKH4JBSQFSBGN',
          parentId: null
        },
        orderBy: { name: 'asc' }
      });
      
      expect(prisma.checkList.findMany).toHaveBeenCalledWith({
        where: { parentId: '01ITEM1234567890ABC' },
        orderBy: { name: 'asc' }
      });
      
      expect(prisma.checkList.findMany).toHaveBeenCalledWith({
        where: { parentId: '01ITEM3456789012GHI' },
        orderBy: { name: 'asc' }
      });
      
      expect(prisma.checkList.findMany).toHaveBeenCalledWith({
        where: { parentId: '01ITEM2345678901DEF' },
        orderBy: { name: 'asc' }
      });
      
      expect(result).toEqual([
        {
          check_id: '01ITEM1234567890ABC',
          name: 'チェック項目1',
          description: '説明1',
          parent_id: null,
          item_type: 'simple',
          is_conclusion: false,
          flow_data: null,
          meta_data: null,
          check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN',
          children: [
            {
              check_id: '01ITEM3456789012GHI',
              name: 'チェック項目1-1',
              description: '説明1-1',
              parent_id: '01ITEM1234567890ABC',
              item_type: 'simple',
              is_conclusion: false,
              flow_data: null,
              meta_data: null,
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
          meta_data: null,
          check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN',
          children: []
        }
      ]);
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
      
      const mockCreatedData = {
        id: '01MOCKITEM123456789',
        name: createData.name,
        description: createData.description,
        parentId: null,
        itemType: createData.itemType,
        isConclusion: false,
        flowData: {},
        metaData: {},
        checkListSetId: createData.checkListSetId
      };
      
      prisma.checkList.create.mockResolvedValue(mockCreatedData);

      // テスト対象の実行
      const result = await repository.createCheckListItem(createData);

      // 検証
      expect(prisma.checkList.create).toHaveBeenCalledWith({
        data: {
          id: '01MOCKITEM123456789',
          name: createData.name,
          description: createData.description,
          parentId: undefined,
          itemType: createData.itemType,
          isConclusion: false,
          flowData: {},
          metaData: {},
          checkListSetId: createData.checkListSetId
        }
      });
      
      expect(result).toEqual({
        check_id: '01MOCKITEM123456789',
        name: createData.name,
        description: createData.description || '',
        parent_id: null,
        item_type: createData.itemType,
        is_conclusion: false,
        flow_data: {},
        meta_data: {},
        check_list_set_id: createData.checkListSetId
      });
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
      
      // 存在確認用のモック
      prisma.checkList.findUnique.mockResolvedValue({
        id,
        name: '更新前のチェック項目',
        description: '更新前の説明',
        parentId: null,
        itemType: 'simple',
        isConclusion: false,
        flowData: null,
        metaData: null,
        checkListSetId: '01B5NHDV91YF9QKH4JBSQFSBGN'
      });
      
      // 更新用のモック
      const mockUpdatedData = {
        id,
        name: updateData.name,
        description: updateData.description,
        parentId: null,
        itemType: 'simple',
        isConclusion: false,
        flowData: null,
        metaData: null,
        checkListSetId: '01B5NHDV91YF9QKH4JBSQFSBGN'
      };
      
      prisma.checkList.update.mockResolvedValue(mockUpdatedData);

      // テスト対象の実行
      const result = await repository.updateCheckListItem(id, updateData);

      // 検証
      expect(prisma.checkList.findUnique).toHaveBeenCalledWith({
        where: { id }
      });
      
      expect(prisma.checkList.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          name: updateData.name,
          description: updateData.description,
          parentId: undefined,
          itemType: undefined,
          isConclusion: undefined,
          flowData: undefined,
          metaData: undefined,
          checkListSetId: undefined
        }
      });
      
      expect(result).toEqual({
        check_id: id,
        name: updateData.name || '',
        description: updateData.description || '',
        parent_id: null,
        item_type: 'simple',
        is_conclusion: false,
        flow_data: null,
        meta_data: null,
        check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN'
      });
    });
    
    it('存在しないIDの場合はnullを返すこと', async () => {
      // モックの設定
      const id = 'non-existent-id';
      const updateData: UpdateCheckListItemRequest = {
        name: '更新後のチェック項目'
      };
      
      // 存在確認用のモック
      prisma.checkList.findUnique.mockResolvedValue(null);

      // テスト対象の実行
      const result = await repository.updateCheckListItem(id, updateData);

      // 検証
      expect(prisma.checkList.findUnique).toHaveBeenCalledWith({
        where: { id }
      });
      
      expect(prisma.checkList.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
  
  describe('deleteCheckListItem', () => {
    it('チェックリスト項目を削除できること', async () => {
      // モックの設定
      const id = '01ITEM1234567890ABC';
      prisma.checkList.delete.mockResolvedValue({
        id,
        name: '削除されるチェック項目',
        description: '削除される説明'
      });

      // テスト対象の実行
      const result = await repository.deleteCheckListItem(id);

      // 検証
      expect(prisma.checkList.delete).toHaveBeenCalledWith({
        where: { id }
      });
      expect(result).toBe(true);
    });
    
    it('存在しないIDの場合はfalseを返すこと', async () => {
      // モックの設定
      const id = 'non-existent-id';
      prisma.checkList.delete.mockRejectedValue(new Error('Record not found'));

      // テスト対象の実行
      const result = await repository.deleteCheckListItem(id);

      // 検証
      expect(prisma.checkList.delete).toHaveBeenCalledWith({
        where: { id }
      });
      expect(result).toBe(false);
    });
  });
});

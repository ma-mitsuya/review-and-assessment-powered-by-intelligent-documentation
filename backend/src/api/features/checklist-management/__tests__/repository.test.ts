/**
 * チェックリストセットリポジトリのテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaCheckListSetRepository } from '../repository';
import { CreateCheckListSetRequest, UpdateCheckListSetRequest } from '../types';

// ulid モック
vi.mock('ulid', () => ({
  ulid: () => '01MOCK123456789ABCDEF'
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
      checkListSet: {
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

describe('PrismaCheckListSetRepository', () => {
  let prisma: any;
  let repository: PrismaCheckListSetRepository;

  beforeEach(() => {
    vi.resetAllMocks();
    
    // モックPrismaクライアントの作成
    prisma = {
      checkListSet: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      }
    };
    
    repository = new PrismaCheckListSetRepository(prisma);
  });

  describe('getCheckListSets', () => {
    it('チェックリストセットの一覧を取得できること', async () => {
      // モックの設定
      const mockData = [
        {
          id: '01B5NHDV91YF9QKH4JBSQFSBGN',
          name: '自社物件チェックリストセット',
          description: '自社物件の契約書チェック用のセット'
        },
        {
          id: '01DAG9M3AQN08QVNFMW6P6MKSG',
          name: '他社物件チェックリストセット',
          description: '他社物件の契約書チェック用のセット'
        }
      ];
      prisma.checkListSet.findMany.mockResolvedValue(mockData);

      // テスト対象の実行
      const result = await repository.getCheckListSets();

      // 検証
      expect(prisma.checkListSet.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        orderBy: { name: 'asc' }
      });
      expect(result).toEqual([
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
      ]);
    });

    it('ページネーションパラメータを正しく処理できること', async () => {
      // モックの設定
      const mockData = [
        {
          id: '01B5NHDV91YF9QKH4JBSQFSBGN',
          name: '自社物件チェックリストセット',
          description: '自社物件の契約書チェック用のセット'
        }
      ];
      prisma.checkListSet.findMany.mockResolvedValue(mockData);

      // テスト対象の実行
      const result = await repository.getCheckListSets({ page: 2, limit: 10 });

      // 検証
      expect(prisma.checkListSet.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        orderBy: { name: 'asc' }
      });
      expect(result).toEqual([
        {
          check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN',
          name: '自社物件チェックリストセット',
          description: '自社物件の契約書チェック用のセット'
        }
      ]);
    });

    it('ソートパラメータを正しく処理できること', async () => {
      // モックの設定
      const mockData = [
        {
          id: '01DAG9M3AQN08QVNFMW6P6MKSG',
          name: '他社物件チェックリストセット',
          description: '他社物件の契約書チェック用のセット'
        },
        {
          id: '01B5NHDV91YF9QKH4JBSQFSBGN',
          name: '自社物件チェックリストセット',
          description: '自社物件の契約書チェック用のセット'
        }
      ];
      prisma.checkListSet.findMany.mockResolvedValue(mockData);

      // テスト対象の実行
      const result = await repository.getCheckListSets({ sortBy: 'name', sortOrder: 'desc' });

      // 検証
      expect(prisma.checkListSet.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        orderBy: { name: 'desc' }
      });
      expect(result).toEqual([
        {
          check_list_set_id: '01DAG9M3AQN08QVNFMW6P6MKSG',
          name: '他社物件チェックリストセット',
          description: '他社物件の契約書チェック用のセット'
        },
        {
          check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN',
          name: '自社物件チェックリストセット',
          description: '自社物件の契約書チェック用のセット'
        }
      ]);
    });
  });

  describe('countCheckListSets', () => {
    it('チェックリストセットの総数を取得できること', async () => {
      // モックの設定
      prisma.checkListSet.count.mockResolvedValue(2);

      // テスト対象の実行
      const result = await repository.countCheckListSets();

      // 検証
      expect(prisma.checkListSet.count).toHaveBeenCalled();
      expect(result).toBe(2);
    });
  });

  describe('getCheckListSetById', () => {
    it('IDによるチェックリストセットの取得ができること', async () => {
      // モックの設定
      const mockData = {
        id: '01B5NHDV91YF9QKH4JBSQFSBGN',
        name: '自社物件チェックリストセット',
        description: '自社物件の契約書チェック用のセット'
      };
      prisma.checkListSet.findUnique.mockResolvedValue(mockData);

      // テスト対象の実行
      const result = await repository.getCheckListSetById('01B5NHDV91YF9QKH4JBSQFSBGN');

      // 検証
      expect(prisma.checkListSet.findUnique).toHaveBeenCalledWith({
        where: { id: '01B5NHDV91YF9QKH4JBSQFSBGN' }
      });
      expect(result).toEqual({
        check_list_set_id: '01B5NHDV91YF9QKH4JBSQFSBGN',
        name: '自社物件チェックリストセット',
        description: '自社物件の契約書チェック用のセット'
      });
    });

    it('存在しないIDの場合はnullを返すこと', async () => {
      // モックの設定
      prisma.checkListSet.findUnique.mockResolvedValue(null);

      // テスト対象の実行
      const result = await repository.getCheckListSetById('non-existent-id');

      // 検証
      expect(prisma.checkListSet.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' }
      });
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
      
      const mockCreatedData = {
        id: '01MOCK123456789ABCDEF',
        name: createData.name,
        description: createData.description
      };
      
      prisma.checkListSet.create.mockResolvedValue(mockCreatedData);

      // テスト対象の実行
      const result = await repository.createCheckListSet(createData);

      // 検証
      expect(prisma.checkListSet.create).toHaveBeenCalledWith({
        data: {
          id: '01MOCK123456789ABCDEF',
          name: createData.name,
          description: createData.description
        }
      });
      
      expect(result).toEqual({
        check_list_set_id: '01MOCK123456789ABCDEF',
        name: createData.name,
        description: createData.description
      });
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
      
      // 存在確認用のモック
      prisma.checkListSet.findUnique.mockResolvedValue({
        id,
        name: '更新前のチェックリストセット',
        description: '更新前の説明'
      });
      
      // 更新用のモック
      const mockUpdatedData = {
        id,
        name: updateData.name,
        description: updateData.description
      };
      
      prisma.checkListSet.update.mockResolvedValue(mockUpdatedData);

      // テスト対象の実行
      const result = await repository.updateCheckListSet(id, updateData);

      // 検証
      expect(prisma.checkListSet.findUnique).toHaveBeenCalledWith({
        where: { id }
      });
      
      expect(prisma.checkListSet.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          name: updateData.name,
          description: updateData.description
        }
      });
      
      expect(result).toEqual({
        check_list_set_id: id,
        name: updateData.name,
        description: updateData.description
      });
    });
    
    it('存在しないIDの場合はnullを返すこと', async () => {
      // モックの設定
      const id = 'non-existent-id';
      const updateData: UpdateCheckListSetRequest = {
        name: '更新後のチェックリストセット'
      };
      
      // 存在確認用のモック
      prisma.checkListSet.findUnique.mockResolvedValue(null);

      // テスト対象の実行
      const result = await repository.updateCheckListSet(id, updateData);

      // 検証
      expect(prisma.checkListSet.findUnique).toHaveBeenCalledWith({
        where: { id }
      });
      
      expect(prisma.checkListSet.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
    
    it('部分的な更新ができること', async () => {
      // モックの設定
      const id = '01B5NHDV91YF9QKH4JBSQFSBGN';
      const updateData: UpdateCheckListSetRequest = {
        name: '更新後のチェックリストセット'
        // descriptionは更新しない
      };
      
      // 存在確認用のモック
      prisma.checkListSet.findUnique.mockResolvedValue({
        id,
        name: '更新前のチェックリストセット',
        description: '更新しない説明'
      });
      
      // 更新用のモック
      const mockUpdatedData = {
        id,
        name: updateData.name,
        description: '更新しない説明'
      };
      
      prisma.checkListSet.update.mockResolvedValue(mockUpdatedData);

      // テスト対象の実行
      const result = await repository.updateCheckListSet(id, updateData);

      // 検証
      expect(prisma.checkListSet.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          name: updateData.name,
          description: undefined
        }
      });
      
      expect(result).toEqual({
        check_list_set_id: id,
        name: updateData.name,
        description: '更新しない説明'
      });
    });
  });
  
  describe('deleteCheckListSet', () => {
    it('チェックリストセットを削除できること', async () => {
      // モックの設定
      const id = '01B5NHDV91YF9QKH4JBSQFSBGN';
      prisma.checkListSet.delete.mockResolvedValue({
        id,
        name: '削除されるチェックリストセット',
        description: '削除される説明'
      });

      // テスト対象の実行
      const result = await repository.deleteCheckListSet(id);

      // 検証
      expect(prisma.checkListSet.delete).toHaveBeenCalledWith({
        where: { id }
      });
      expect(result).toBe(true);
    });
    
    it('存在しないIDの場合はfalseを返すこと', async () => {
      // モックの設定
      const id = 'non-existent-id';
      prisma.checkListSet.delete.mockRejectedValue(new Error('Record not found'));

      // テスト対象の実行
      const result = await repository.deleteCheckListSet(id);

      // 検証
      expect(prisma.checkListSet.delete).toHaveBeenCalledWith({
        where: { id }
      });
      expect(result).toBe(false);
    });
  });
});

/**
 * チェックリストセットリポジトリのテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaCheckListSetRepository } from '../repository';

// Prismaのモック
vi.mock('@prisma/client', () => {
  const mockFindMany = vi.fn();
  const mockCount = vi.fn();
  const mockFindUnique = vi.fn();

  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      checkListSet: {
        findMany: mockFindMany,
        count: mockCount,
        findUnique: mockFindUnique
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
        findUnique: vi.fn()
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
});

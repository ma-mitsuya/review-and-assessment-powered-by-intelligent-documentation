/**
 * チェックリストセット関連のデータアクセス層
 */

import { PrismaClient } from '@prisma/client';
import { CheckListSet, GetCheckListSetsParams } from './types';

/**
 * チェックリストセットリポジトリのインターフェース
 */
export interface CheckListSetRepository {
  /**
   * チェックリストセットの一覧を取得する
   * @param params フィルタリング、ページネーション、ソートのパラメータ
   * @returns チェックリストセットの配列
   */
  getCheckListSets(params?: GetCheckListSetsParams): Promise<CheckListSet[]>;

  /**
   * チェックリストセットの総数を取得する
   * @param params フィルタリングパラメータ
   * @returns チェックリストセットの総数
   */
  countCheckListSets(params?: GetCheckListSetsParams): Promise<number>;

  /**
   * IDによるチェックリストセットの取得
   * @param id チェックリストセットID
   * @returns チェックリストセット、存在しない場合はnull
   */
  getCheckListSetById(id: string): Promise<CheckListSet | null>;
}

/**
 * モック実装のチェックリストセットリポジトリ
 */
export class MockCheckListSetRepository implements CheckListSetRepository {
  private mockData: CheckListSet[] = [
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

  async getCheckListSets(params?: GetCheckListSetsParams): Promise<CheckListSet[]> {
    // ページネーション処理
    if (params?.page && params?.limit) {
      const start = (params.page - 1) * params.limit;
      const end = start + params.limit;
      return this.mockData.slice(start, end);
    }
    return this.mockData;
  }

  async countCheckListSets(): Promise<number> {
    return this.mockData.length;
  }

  async getCheckListSetById(id: string): Promise<CheckListSet | null> {
    return this.mockData.find(set => set.check_list_set_id === id) || null;
  }
}

/**
 * Prismaを使用したチェックリストセットリポジトリの実装
 */
export class PrismaCheckListSetRepository implements CheckListSetRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getCheckListSets(params?: GetCheckListSetsParams): Promise<CheckListSet[]> {
    const skip = params?.page && params?.limit ? (params.page - 1) * params.limit : undefined;
    const take = params?.limit;
    
    const checkListSets = await this.prisma.checkListSet.findMany({
      skip,
      take,
      orderBy: params?.sortBy ? { [params.sortBy]: params.sortOrder || 'asc' } : { name: 'asc' }
    });

    return checkListSets.map(set => ({
      check_list_set_id: set.id,
      name: set.name,
      description: set.description || ''
    }));
  }

  async countCheckListSets(): Promise<number> {
    return this.prisma.checkListSet.count();
  }

  async getCheckListSetById(id: string): Promise<CheckListSet | null> {
    const checkListSet = await this.prisma.checkListSet.findUnique({
      where: { id }
    });

    if (!checkListSet) return null;

    return {
      check_list_set_id: checkListSet.id,
      name: checkListSet.name,
      description: checkListSet.description || ''
    };
  }
}

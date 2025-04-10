/**
 * チェックリストセット関連のデータアクセス層
 */

import { PrismaClient } from '@prisma/client';
import { CheckListSet, GetCheckListSetsParams, CreateCheckListSetRequest, UpdateCheckListSetRequest } from './types';
import { ulid } from 'ulid';

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
  
  /**
   * チェックリストセットを作成する
   * @param data 作成するチェックリストセットのデータ
   * @returns 作成されたチェックリストセット
   */
  createCheckListSet(data: CreateCheckListSetRequest): Promise<CheckListSet>;
  
  /**
   * チェックリストセットを更新する
   * @param id 更新するチェックリストセットのID
   * @param data 更新データ
   * @returns 更新されたチェックリストセット、存在しない場合はnull
   */
  updateCheckListSet(id: string, data: UpdateCheckListSetRequest): Promise<CheckListSet | null>;
  
  /**
   * チェックリストセットを削除する
   * @param id 削除するチェックリストセットのID
   * @returns 削除に成功した場合はtrue、存在しない場合はfalse
   */
  deleteCheckListSet(id: string): Promise<boolean>;
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
  
  async createCheckListSet(data: CreateCheckListSetRequest): Promise<CheckListSet> {
    const id = ulid();
    
    const checkListSet = await this.prisma.checkListSet.create({
      data: {
        id,
        name: data.name,
        description: data.description
      }
    });
    
    return {
      check_list_set_id: checkListSet.id,
      name: checkListSet.name,
      description: checkListSet.description || ''
    };
  }
  
  async updateCheckListSet(id: string, data: UpdateCheckListSetRequest): Promise<CheckListSet | null> {
    // 更新前に存在確認
    const exists = await this.prisma.checkListSet.findUnique({
      where: { id }
    });
    
    if (!exists) return null;
    
    const checkListSet = await this.prisma.checkListSet.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        description: data.description !== undefined ? data.description : undefined
      }
    });
    
    return {
      check_list_set_id: checkListSet.id,
      name: checkListSet.name,
      description: checkListSet.description || ''
    };
  }
  
  async deleteCheckListSet(id: string): Promise<boolean> {
    try {
      await this.prisma.checkListSet.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      // レコードが存在しない場合や外部キー制約などでエラーが発生した場合
      return false;
    }
  }
}

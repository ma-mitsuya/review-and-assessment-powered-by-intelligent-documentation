/**
 * チェックリスト項目関連のデータアクセス層
 */

import { PrismaClient } from '@prisma/client';
import { CheckListItem, GetCheckListItemsParams, CreateCheckListItemRequest, UpdateCheckListItemRequest } from './types';
import { ulid } from 'ulid';

/**
 * チェックリスト項目リポジトリのインターフェース
 */
export interface CheckListItemRepository {
  /**
   * チェックリスト項目の一覧を取得する
   * @param params フィルタリング、ページネーション、ソートのパラメータ
   * @returns チェックリスト項目の配列
   */
  getCheckListItems(params?: GetCheckListItemsParams): Promise<CheckListItem[]>;

  /**
   * チェックリスト項目の総数を取得する
   * @param params フィルタリングパラメータ
   * @returns チェックリスト項目の総数
   */
  countCheckListItems(params?: GetCheckListItemsParams): Promise<number>;

  /**
   * IDによるチェックリスト項目の取得
   * @param id チェックリスト項目ID
   * @returns チェックリスト項目、存在しない場合はnull
   */
  getCheckListItemById(id: string): Promise<CheckListItem | null>;
  
  /**
   * チェックリストセットに属する項目を階層構造で取得する
   * @param checkListSetId チェックリストセットID
   * @returns 階層構造のチェックリスト項目配列
   */
  getCheckListItemsHierarchy(checkListSetId: string): Promise<CheckListItem[]>;
  
  /**
   * チェックリスト項目を作成する
   * @param data 作成するチェックリスト項目のデータ
   * @returns 作成されたチェックリスト項目
   */
  createCheckListItem(data: CreateCheckListItemRequest): Promise<CheckListItem>;
  
  /**
   * チェックリスト項目を更新する
   * @param id 更新するチェックリスト項目のID
   * @param data 更新データ
   * @returns 更新されたチェックリスト項目、存在しない場合はnull
   */
  updateCheckListItem(id: string, data: UpdateCheckListItemRequest): Promise<CheckListItem | null>;
  
  /**
   * チェックリスト項目を削除する
   * @param id 削除するチェックリスト項目のID
   * @returns 削除に成功した場合はtrue、存在しない場合はfalse
   */
  deleteCheckListItem(id: string): Promise<boolean>;
}

/**
 * Prismaを使用したチェックリスト項目リポジトリの実装
 */
export class PrismaCheckListItemRepository implements CheckListItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getCheckListItems(params?: GetCheckListItemsParams): Promise<CheckListItem[]> {
    const skip = params?.page && params?.limit ? (params.page - 1) * params.limit : undefined;
    const take = params?.limit;
    
    const checkListItems = await this.prisma.checkList.findMany({
      skip,
      take,
      where: {
        checkListSetId: params?.checkListSetId,
        parentId: params?.parentId,
        itemType: params?.itemType
      },
      orderBy: params?.sortBy ? { [params.sortBy]: params.sortOrder || 'asc' } : { name: 'asc' }
    });

    return checkListItems.map(item => this.mapPrismaCheckListToCheckListItem(item));
  }

  async countCheckListItems(params?: GetCheckListItemsParams): Promise<number> {
    return this.prisma.checkList.count({
      where: {
        checkListSetId: params?.checkListSetId,
        parentId: params?.parentId,
        itemType: params?.itemType
      }
    });
  }

  async getCheckListItemById(id: string): Promise<CheckListItem | null> {
    const checkListItem = await this.prisma.checkList.findUnique({
      where: { id }
    });

    if (!checkListItem) return null;

    return this.mapPrismaCheckListToCheckListItem(checkListItem);
  }
  
  async getCheckListItemsHierarchy(checkListSetId: string): Promise<CheckListItem[]> {
    // ルート項目（親を持たない項目）を取得
    const rootItems = await this.prisma.checkList.findMany({
      where: {
        checkListSetId,
        parentId: null
      },
      orderBy: { name: 'asc' }
    });
    
    // 各ルート項目に対して再帰的に子項目を取得
    const result: CheckListItem[] = [];
    
    for (const rootItem of rootItems) {
      const item = this.mapPrismaCheckListToCheckListItem(rootItem);
      item.children = await this.getChildrenRecursive(rootItem.id);
      result.push(item);
    }
    
    return result;
  }
  
  private async getChildrenRecursive(parentId: string): Promise<CheckListItem[]> {
    const children = await this.prisma.checkList.findMany({
      where: { parentId },
      orderBy: { name: 'asc' }
    });
    
    const result: CheckListItem[] = [];
    
    for (const child of children) {
      const item = this.mapPrismaCheckListToCheckListItem(child);
      item.children = await this.getChildrenRecursive(child.id);
      result.push(item);
    }
    
    return result;
  }
  
  async createCheckListItem(data: CreateCheckListItemRequest): Promise<CheckListItem> {
    const id = ulid();
    
    const checkListItem = await this.prisma.checkList.create({
      data: {
        id,
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        itemType: data.itemType,
        isConclusion: data.isConclusion || false,
        flowData: data.flowData || {},
        metaData: data.metaData || {},
        checkListSetId: data.checkListSetId
      }
    });
    
    return this.mapPrismaCheckListToCheckListItem(checkListItem);
  }
  
  async updateCheckListItem(id: string, data: UpdateCheckListItemRequest): Promise<CheckListItem | null> {
    // 更新前に存在確認
    const exists = await this.prisma.checkList.findUnique({
      where: { id }
    });
    
    if (!exists) return null;
    
    const checkListItem = await this.prisma.checkList.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        description: data.description !== undefined ? data.description : undefined,
        parentId: data.parentId !== undefined ? data.parentId : undefined,
        itemType: data.itemType !== undefined ? data.itemType : undefined,
        isConclusion: data.isConclusion !== undefined ? data.isConclusion : undefined,
        flowData: data.flowData !== undefined ? data.flowData : undefined,
        metaData: data.metaData !== undefined ? data.metaData : undefined,
        checkListSetId: data.checkListSetId !== undefined ? data.checkListSetId : undefined
      }
    });
    
    return this.mapPrismaCheckListToCheckListItem(checkListItem);
  }
  
  async deleteCheckListItem(id: string): Promise<boolean> {
    try {
      await this.prisma.checkList.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      // レコードが存在しない場合や外部キー制約などでエラーが発生した場合
      return false;
    }
  }
  
  /**
   * Prismaのチェックリスト型をAPIの型に変換する
   */
  private mapPrismaCheckListToCheckListItem(item: any): CheckListItem {
    return {
      check_id: item.id,
      name: item.name,
      description: item.description || '',
      parent_id: item.parentId,
      item_type: item.itemType as 'simple' | 'flow',
      is_conclusion: item.isConclusion,
      flow_data: item.flowData,
      meta_data: item.metaData,
      check_list_set_id: item.checkListSetId
    };
  }
}

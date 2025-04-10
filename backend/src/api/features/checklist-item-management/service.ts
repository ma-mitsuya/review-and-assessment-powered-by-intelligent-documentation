/**
 * チェックリスト項目関連のビジネスロジック層
 */

import { CheckListItem, GetCheckListItemsParams, CreateCheckListItemRequest, UpdateCheckListItemRequest } from './types';
import { CheckListItemRepository } from './repository';

/**
 * チェックリスト項目サービスのインターフェース
 */
export interface CheckListItemService {
  /**
   * チェックリスト項目の一覧を取得する
   * @param params フィルタリング、ページネーション、ソートのパラメータ
   * @returns チェックリスト項目の配列と総数
   */
  getCheckListItems(params?: GetCheckListItemsParams): Promise<{
    checkListItems: CheckListItem[];
    total: number;
  }>;

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
 * チェックリスト項目サービスの実装
 */
export class CheckListItemServiceImpl implements CheckListItemService {
  constructor(private readonly repository: CheckListItemRepository) {}

  async getCheckListItems(params?: GetCheckListItemsParams): Promise<{
    checkListItems: CheckListItem[];
    total: number;
  }> {
    // リポジトリからデータを取得
    const checkListItems = await this.repository.getCheckListItems(params);
    const total = await this.repository.countCheckListItems(params);

    return {
      checkListItems,
      total
    };
  }

  async getCheckListItemById(id: string): Promise<CheckListItem | null> {
    return this.repository.getCheckListItemById(id);
  }
  
  async getCheckListItemsHierarchy(checkListSetId: string): Promise<CheckListItem[]> {
    if (!checkListSetId) {
      throw new Error('チェックリストセットIDは必須です');
    }
    
    return this.repository.getCheckListItemsHierarchy(checkListSetId);
  }
  
  async createCheckListItem(data: CreateCheckListItemRequest): Promise<CheckListItem> {
    // 入力値の検証
    if (!data.name || data.name.trim() === '') {
      throw new Error('チェックリスト項目名は必須です');
    }
    
    if (!data.itemType) {
      throw new Error('項目タイプは必須です');
    }
    
    if (!data.checkListSetId) {
      throw new Error('チェックリストセットIDは必須です');
    }
    
    // フロー型の場合、フローデータが必要
    if (data.itemType === 'flow' && !data.flowData) {
      throw new Error('フロー型の場合、フローデータは必須です');
    }
    
    return this.repository.createCheckListItem(data);
  }
  
  async updateCheckListItem(id: string, data: UpdateCheckListItemRequest): Promise<CheckListItem | null> {
    // 入力値の検証
    if (data.name !== undefined && data.name.trim() === '') {
      throw new Error('チェックリスト項目名は空にできません');
    }
    
    // フロー型に変更する場合、フローデータが必要
    if (data.itemType === 'flow' && data.flowData === undefined) {
      throw new Error('フロー型に変更する場合、フローデータは必須です');
    }
    
    return this.repository.updateCheckListItem(id, data);
  }
  
  async deleteCheckListItem(id: string): Promise<boolean> {
    return this.repository.deleteCheckListItem(id);
  }
}

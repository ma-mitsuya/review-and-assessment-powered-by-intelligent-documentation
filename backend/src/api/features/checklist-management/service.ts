/**
 * チェックリストセット関連のビジネスロジック層
 */

import { CheckListSet, GetCheckListSetsParams, CreateCheckListSetRequest, UpdateCheckListSetRequest } from './types';
import { CheckListSetRepository } from './repository';

/**
 * チェックリストセットサービスのインターフェース
 */
export interface CheckListSetService {
  /**
   * チェックリストセットの一覧を取得する
   * @param params フィルタリング、ページネーション、ソートのパラメータ
   * @returns チェックリストセットの配列と総数
   */
  getCheckListSets(params?: GetCheckListSetsParams): Promise<{
    checkListSets: CheckListSet[];
    total: number;
  }>;

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
 * チェックリストセットサービスの実装
 */
export class CheckListSetServiceImpl implements CheckListSetService {
  constructor(private readonly repository: CheckListSetRepository) {}

  async getCheckListSets(params?: GetCheckListSetsParams): Promise<{
    checkListSets: CheckListSet[];
    total: number;
  }> {
    // リポジトリからデータを取得
    const checkListSets = await this.repository.getCheckListSets(params);
    const total = await this.repository.countCheckListSets(params);

    return {
      checkListSets,
      total
    };
  }

  async getCheckListSetById(id: string): Promise<CheckListSet | null> {
    return this.repository.getCheckListSetById(id);
  }
  
  async createCheckListSet(data: CreateCheckListSetRequest): Promise<CheckListSet> {
    // 入力値の検証
    if (!data.name || data.name.trim() === '') {
      throw new Error('チェックリストセット名は必須です');
    }
    
    return this.repository.createCheckListSet(data);
  }
  
  async updateCheckListSet(id: string, data: UpdateCheckListSetRequest): Promise<CheckListSet | null> {
    // 入力値の検証
    if (data.name !== undefined && data.name.trim() === '') {
      throw new Error('チェックリストセット名は空にできません');
    }
    
    return this.repository.updateCheckListSet(id, data);
  }
  
  async deleteCheckListSet(id: string): Promise<boolean> {
    return this.repository.deleteCheckListSet(id);
  }
}

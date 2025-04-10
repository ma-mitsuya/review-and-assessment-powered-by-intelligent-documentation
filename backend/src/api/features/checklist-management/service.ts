/**
 * チェックリストセット関連のビジネスロジック層
 */

import { CheckListSet, GetCheckListSetsParams } from './types';
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
}

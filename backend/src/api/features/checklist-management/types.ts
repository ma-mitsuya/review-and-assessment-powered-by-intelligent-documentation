/**
 * チェックリスト管理機能の型定義
 */

import { QueryParams } from '../../core/types';

/**
 * チェックリストセットの型定義
 */
export type CheckListSet = {
  check_list_set_id: string;
  name: string;
  description: string;
};

/**
 * チェックリストセット取得のクエリパラメータ
 */
export type GetCheckListSetsParams = QueryParams;

/**
 * チェックリストセット作成のリクエストボディ
 */
export type CreateCheckListSetRequest = {
  name: string;
  description: string;
};

/**
 * チェックリストセット更新のリクエストボディ
 */
export type UpdateCheckListSetRequest = {
  name?: string;
  description?: string;
};

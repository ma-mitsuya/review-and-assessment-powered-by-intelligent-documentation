/**
 * チェックリスト項目管理機能の型定義
 */

import { QueryParams } from '../../core/types';
import { FlowData, MetaData } from '../../../features/common/flow-chart-types';

/**
 * チェックリスト項目の型定義
 */
export type CheckListItem = {
  check_id: string;
  name: string;
  description: string;
  parent_id?: string | null;
  item_type: 'simple' | 'flow';
  is_conclusion: boolean;
  flow_data?: FlowData;
  meta_data?: MetaData;
  check_list_set_id?: string | null;
  children?: CheckListItem[];
};

/**
 * チェックリスト項目取得のクエリパラメータ
 */
export type GetCheckListItemsParams = QueryParams & {
  checkListSetId?: string;
  parentId?: string;
  itemType?: string;
};

/**
 * チェックリスト項目作成のリクエストボディ
 */
export type CreateCheckListItemRequest = {
  name: string;
  description?: string;
  parentId?: string;
  itemType: 'simple' | 'flow';
  isConclusion?: boolean;
  flowData?: FlowData;
  metaData?: MetaData;
  checkListSetId: string;
};

/**
 * チェックリスト項目更新のリクエストボディ
 */
export type UpdateCheckListItemRequest = {
  name?: string;
  description?: string;
  parentId?: string;
  itemType?: 'simple' | 'flow';
  isConclusion?: boolean;
  flowData?: FlowData;
  metaData?: MetaData;
  checkListSetId?: string;
};

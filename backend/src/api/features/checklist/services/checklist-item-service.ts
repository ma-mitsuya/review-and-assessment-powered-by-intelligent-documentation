/**
 * チェックリスト項目サービス
 */
import { ChecklistItemRepository, CreateChecklistItemParams, UpdateChecklistItemParams } from '../repositories/checklist-item-repository';
import { DocumentRepository } from '../../document/repositories/document-repository';
import { ChecklistSetRepository } from '../repositories/checklist-set-repository';
import { HierarchicalChecklistItem } from '../types/checklist-item-types';
import { ulid } from 'ulid'; // ulid をインポート

/**
 * チェックリスト項目サービス
 */
export class ChecklistItemService {
  private repository: ChecklistItemRepository;
  private documentRepository: DocumentRepository;
  private checklistSetRepository: ChecklistSetRepository;

  constructor() {
    this.repository = new ChecklistItemRepository();
    this.documentRepository = new DocumentRepository();
    this.checklistSetRepository = new ChecklistSetRepository();
  }

  /**
   * チェックリスト項目を取得する
   * @param checkId チェックリスト項目ID
   * @param checkListSetId チェックリストセットID
   * @returns チェックリスト項目
   * @throws チェックリスト項目が存在しない場合
   */
  async getChecklistItem(checkId: string, checkListSetId: string) {
    // 項目が指定されたセットに属しているか確認
    const belongsToSet = await this.repository.checkItemBelongsToSet(checkId, checkListSetId);
    if (!belongsToSet) {
      throw new Error('チェックリスト項目が見つかりません');
    }

    const item = await this.repository.getChecklistItem(checkId);
    if (!item) {
      throw new Error('チェックリスト項目が見つかりません');
    }

    return item;
  }

  /**
   * チェックリスト項目の階層構造を取得する
   * @param checkListSetId チェックリストセットID
   * @returns 階層構造を持つチェックリスト項目の配列
   */
  async getChecklistItemHierarchy(checkListSetId: string): Promise<HierarchicalChecklistItem[]> {
    // チェックリストセットが存在するか確認
    const checklistSet = await this.checklistSetRepository.getChecklistSetById(checkListSetId);
    
    if (!checklistSet) {
      throw new Error('チェックリストセットが見つかりません');
    }

    // すべての項目を取得
    const items = await this.repository.getChecklistItemHierarchy(checkListSetId);
    
    // 階層構造を構築
    const itemMap = new Map<string, HierarchicalChecklistItem>();
    const rootItems: HierarchicalChecklistItem[] = [];
    
    // まずすべての項目をマップに追加
    items.forEach(item => {
      itemMap.set(item.id, {
        check_id: item.id,
        name: item.name,
        description: item.description,
        parent_id: item.parentId,
        item_type: item.itemType as 'simple' | 'flow',
        is_conclusion: item.isConclusion,
        flow_data: item.flowData as any,
        check_list_set_id: item.checkListSetId,
        document_id: item.documentId,
        children: []
      });
    });
    
    // 親子関係を構築
    items.forEach(item => {
      const hierarchicalItem = itemMap.get(item.id)!;
      
      if (item.parentId && itemMap.has(item.parentId)) {
        // 親項目が存在する場合、その子として追加
        const parent = itemMap.get(item.parentId)!;
        parent.children.push(hierarchicalItem);
      } else {
        // 親項目がない場合はルート項目
        rootItems.push(hierarchicalItem);
      }
    });
    
    return rootItems;
  }

  /**
   * チェックリスト項目を作成する
   * @param params 作成パラメータ
   * @param checkListSetId チェックリストセットID
   * @returns 作成されたチェックリスト項目
   * @throws 親項目が存在しない場合、ドキュメントが存在しない場合
   */
  async createChecklistItem(params: Omit<CreateChecklistItemParams, 'checkListSetId' | 'id'>, checkListSetId: string) {
    // チェックリストセットが存在するか確認
    const checklistSet = await this.checklistSetRepository.getChecklistSetById(checkListSetId);
    
    if (!checklistSet) {
      throw new Error('チェックリストセットが見つかりません');
    }

    // 親項目が指定されている場合、存在確認と同じドキュメントに紐づけるルールを適用
    if (params.parentId) {
      const parentExists = await this.repository.checkItemBelongsToSet(params.parentId, checkListSetId);
      if (!parentExists) {
        throw new Error('親チェックリスト項目が見つかりません');
      }

      // 親項目のドキュメントIDを取得
      const parentDocumentId = await this.repository.getParentDocumentId(params.parentId);
      
      // 親項目と同じドキュメントに紐づける
      if (parentDocumentId && params.documentId && parentDocumentId !== params.documentId) {
        throw new Error('親項目と同じドキュメントに紐づける必要があります');
      } else if (parentDocumentId && !params.documentId) {
        params.documentId = parentDocumentId;
      }
    }

    // ドキュメントが指定されている場合、存在確認
    if (params.documentId) {
      const documentExists = await this.documentRepository.documentExists(params.documentId);
      if (!documentExists) {
        throw new Error('ドキュメントが見つかりません');
      }
    }

    // IDを生成
    const id = ulid();

    // チェックリスト項目を作成
    return this.repository.createChecklistItem({
      id,
      ...params,
      checkListSetId
    });
  }

  /**
   * チェックリスト項目を更新する
   * @param checkId チェックリスト項目ID
   * @param params 更新パラメータ
   * @param checkListSetId チェックリストセットID
   * @returns 更新されたチェックリスト項目
   * @throws チェックリスト項目が存在しない場合、ドキュメントが存在しない場合
   */
  async updateChecklistItem(checkId: string, params: UpdateChecklistItemParams, checkListSetId: string) {
    // 項目が指定されたセットに属しているか確認
    const belongsToSet = await this.repository.checkItemBelongsToSet(checkId, checkListSetId);
    if (!belongsToSet) {
      throw new Error('チェックリスト項目が見つかりません');
    }

    // ドキュメントが指定されている場合、存在確認
    if (params.documentId) {
      const documentExists = await this.documentRepository.documentExists(params.documentId);
      if (!documentExists) {
        throw new Error('ドキュメントが見つかりません');
      }
    }

    // チェックリスト項目を更新
    return this.repository.updateChecklistItem(checkId, params);
  }

  /**
   * チェックリスト項目を削除する
   * @param checkId チェックリスト項目ID
   * @param checkListSetId チェックリストセットID
   * @returns 削除が成功したかどうか
   * @throws チェックリスト項目が存在しない場合
   */
  async deleteChecklistItem(checkId: string, checkListSetId: string): Promise<boolean> {
    // 項目が指定されたセットに属しているか確認
    const belongsToSet = await this.repository.checkItemBelongsToSet(checkId, checkListSetId);
    if (!belongsToSet) {
      throw new Error('チェックリスト項目が見つかりません');
    }

    // チェックリスト項目を削除
    return this.repository.deleteChecklistItem(checkId);
  }
}

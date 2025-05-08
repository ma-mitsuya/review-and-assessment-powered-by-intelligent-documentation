/**
 * チェックリスト項目関連のハンドラー
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { ChecklistItemService } from '../services/checklist-item-service';
import { FlowData } from '../types/checklist-item-types';

/**
 * チェックリスト項目詳細取得リクエストの型定義
 */
interface GetChecklistItemRequest {
  Params: {
    setId: string;
    itemId: string;
  };
}

/**
 * チェックリスト項目階層構造取得リクエストの型定義
 */
interface GetChecklistItemHierarchyRequest {
  Params: {
    setId: string;
  };
}

/**
 * チェックリスト項目作成リクエストの型定義
 */
interface CreateChecklistItemRequest {
  Params: {
    setId: string;
  };
  Body: {
    name: string;
    description?: string;
    parentId?: string | null;
    itemType: 'simple' | 'flow';
    isConclusion: boolean;
    flowData?: FlowData;
    documentId?: string | null;
  };
}

/**
 * チェックリスト項目更新リクエストの型定義
 */
interface UpdateChecklistItemRequest {
  Params: {
    setId: string;
    itemId: string;
  };
  Body: {
    name?: string;
    description?: string;
    isConclusion?: boolean;
    flowData?: FlowData;
    documentId?: string | null;
  };
}

/**
 * チェックリスト項目削除リクエストの型定義
 */
interface DeleteChecklistItemRequest {
  Params: {
    setId: string;
    itemId: string;
  };
}

/**
 * チェックリスト項目詳細取得ハンドラー
 */
export async function getChecklistItemHandler(
  request: FastifyRequest<GetChecklistItemRequest>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { setId, itemId } = request.params;
    
    const checklistItemService = new ChecklistItemService();
    const result = await checklistItemService.getChecklistItem(itemId, setId);

    reply.code(200).send({
      success: true,
      data: {
        check_id: result.id,
        name: result.name,
        description: result.description,
        parent_id: result.parentId,
        item_type: result.itemType,
        is_conclusion: result.isConclusion,
        flow_data: result.flowData,
        check_list_set_id: result.checkListSetId,
        document_id: result.documentId
      }
    });
  } catch (error) {
    request.log.error(error);
    
    if ((error as Error).message === 'チェックリスト項目が見つかりません') {
      reply.code(404).send({
        success: false,
        error: 'チェックリスト項目が見つかりません'
      });
      return;
    }
    
    reply.code(500).send({
      success: false,
      error: 'チェックリスト項目の取得に失敗しました'
    });
  }
}

/**
 * チェックリスト項目階層構造取得ハンドラー
 */
export async function getChecklistItemHierarchyHandler(
  request: FastifyRequest<GetChecklistItemHierarchyRequest>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { setId } = request.params;
    
    const checklistItemService = new ChecklistItemService();
    const result = await checklistItemService.getChecklistItemHierarchy(setId);

    reply.code(200).send({
      success: true,
      data: result
    });
  } catch (error) {
    request.log.error(error);
    
    if ((error as Error).message === 'チェックリストセットが見つかりません') {
      reply.code(404).send({
        success: false,
        error: 'チェックリストセットが見つかりません'
      });
      return;
    }
    
    reply.code(500).send({
      success: false,
      error: 'チェックリスト項目の階層構造取得に失敗しました'
    });
  }
}

/**
 * チェックリスト項目作成ハンドラー
 */
export async function createChecklistItemHandler(
  request: FastifyRequest<CreateChecklistItemRequest>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { setId } = request.params;
    const { name, description, parentId, itemType, isConclusion, flowData, documentId } = request.body;
    
    const checklistItemService = new ChecklistItemService();
    const result = await checklistItemService.createChecklistItem({
      name,
      description,
      parentId,
      itemType,
      isConclusion,
      flowData,
      documentId
    }, setId);

    reply.code(200).send({
      success: true,
      data: {
        check_id: result.id,
        name: result.name,
        description: result.description,
        parent_id: result.parentId,
        item_type: result.itemType,
        is_conclusion: result.isConclusion,
        flow_data: result.flowData,
        check_list_set_id: result.checkListSetId,
        document_id: result.documentId
      }
    });
  } catch (error) {
    request.log.error(error);
    
    const errorMessage = (error as Error).message;
    if (
      errorMessage === 'チェックリストセットが見つかりません' ||
      errorMessage === '親チェックリスト項目が見つかりません' ||
      errorMessage === 'ドキュメントが見つかりません'
    ) {
      reply.code(404).send({
        success: false,
        error: errorMessage
      });
      return;
    }
    
    if (errorMessage === '親項目と同じドキュメントに紐づける必要があります') {
      reply.code(400).send({
        success: false,
        error: errorMessage
      });
      return;
    }

    if (errorMessage === 'LINKED_REVIEW_JOBS') {
      reply.code(400).send({
        success: false,
        error: 'このチェックリスト項目は審査ジョブに紐づいているチェックリストセットに属しているため編集できません',
        code: 'LINKED_REVIEW_JOBS'
      });
      return;
    }
    
    reply.code(500).send({
      success: false,
      error: 'チェックリスト項目の作成に失敗しました'
    });
  }
}

/**
 * チェックリスト項目更新ハンドラー
 */
export async function updateChecklistItemHandler(
  request: FastifyRequest<UpdateChecklistItemRequest>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { setId, itemId } = request.params;
    const { name, description, isConclusion, flowData, documentId } = request.body;
    
    const checklistItemService = new ChecklistItemService();
    const result = await checklistItemService.updateChecklistItem(itemId, {
      name,
      description,
      isConclusion,
      flowData,
      documentId
    }, setId);

    reply.code(200).send({
      success: true,
      data: {
        check_id: result.id,
        name: result.name,
        description: result.description,
        parent_id: result.parentId,
        item_type: result.itemType,
        is_conclusion: result.isConclusion,
        flow_data: result.flowData,
        check_list_set_id: result.checkListSetId,
        document_id: result.documentId
      }
    });
  } catch (error) {
    request.log.error(error);
    
    const errorMessage = (error as Error).message;
    if (
      errorMessage === 'チェックリスト項目が見つかりません' ||
      errorMessage === 'ドキュメントが見つかりません'
    ) {
      reply.code(404).send({
        success: false,
        error: errorMessage
      });
      return;
    }

    if (errorMessage === 'LINKED_REVIEW_JOBS') {
      reply.code(400).send({
        success: false,
        error: 'このチェックリスト項目は審査ジョブに紐づいているチェックリストセットに属しているため編集できません',
        code: 'LINKED_REVIEW_JOBS'
      });
      return;
    }
    
    reply.code(500).send({
      success: false,
      error: 'チェックリスト項目の更新に失敗しました'
    });
  }
}

/**
 * チェックリスト項目削除ハンドラー
 */
export async function deleteChecklistItemHandler(
  request: FastifyRequest<DeleteChecklistItemRequest>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { setId, itemId } = request.params;
    
    const checklistItemService = new ChecklistItemService();
    await checklistItemService.deleteChecklistItem(itemId, setId);

    reply.code(200).send({
      success: true,
      data: {
        deleted: true
      }
    });
  } catch (error) {
    request.log.error(error);
    
    const errorMessage = (error as Error).message;
    if (errorMessage === 'チェックリスト項目が見つかりません') {
      reply.code(404).send({
        success: false,
        error: 'チェックリスト項目が見つかりません'
      });
      return;
    }

    if (errorMessage === 'LINKED_REVIEW_JOBS') {
      reply.code(400).send({
        success: false,
        error: 'このチェックリスト項目は審査ジョブに紐づいているチェックリストセットに属しているため削除できません',
        code: 'LINKED_REVIEW_JOBS'
      });
      return;
    }
    
    reply.code(500).send({
      success: false,
      error: 'チェックリスト項目の削除に失敗しました'
    });
  }
}

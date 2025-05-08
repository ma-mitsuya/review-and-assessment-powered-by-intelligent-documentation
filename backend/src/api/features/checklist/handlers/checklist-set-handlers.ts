/**
 * チェックリストセット関連のハンドラー
 */
import { FastifyReply, FastifyRequest } from "fastify";
import {
  ChecklistSetService,
  DocumentInfo,
} from "../services/checklist-set-service";
import { UpdateChecklistSetParams } from "../repositories/checklist-set-repository";

/**
 * チェックリストセット作成リクエストの型定義
 */
interface CreateChecklistSetRequest {
  name: string;
  description?: string;
  documents: DocumentInfo[];
}

/**
 * チェックリストセット更新リクエストの型定義
 */
interface UpdateChecklistSetRequest {
  name?: string;
  description?: string;
}

/**
 * チェックリストセット一覧取得リクエストの型定義
 */
interface GetChecklistSetsRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * チェックリストセット作成ハンドラー
 */
export async function createChecklistSetHandler(
  request: FastifyRequest<{ Body: CreateChecklistSetRequest }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { name, description, documents } = request.body;

    const checklistSetService = new ChecklistSetService();
    const result = await checklistSetService.createChecklistSet({
      name,
      description,
      documents: documents || [],
    });

    reply.code(200).send({
      success: true,
      data: {
        check_list_set_id: result.id,
        name: result.name,
        description: result.description,
        processing_status: "pending",
        is_editable: true, // 新規作成時は必ず編集可能
      },
    });
  } catch (error) {
    request.log.error(error);

    reply.code(500).send({
      success: false,
      error: "チェックリストセットの作成に失敗しました",
    });
  }
}

/**
 * チェックリストセット一覧取得ハンドラー
 */
export async function getChecklistSetsHandler(
  request: FastifyRequest<{ Querystring: GetChecklistSetsRequest }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { page = 1, limit = 10, sortBy, sortOrder } = request.query;

    const checklistSetService = new ChecklistSetService();
    const result = await checklistSetService.getChecklistSets({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const response = {
      success: true,
      data: result,
    };

    reply.code(200).send(response);
  } catch (error) {
    request.log.error(error);

    reply.code(500).send({
      success: false,
      error: "チェックリストセット一覧の取得に失敗しました",
    });
  }
}

/**
 * チェックリストセット更新ハンドラー
 */
export async function updateChecklistSetHandler(
  request: FastifyRequest<{
    Params: { id: string };
    Body: UpdateChecklistSetRequest;
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id } = request.params;
    const { name, description } = request.body;

    const checklistSetService = new ChecklistSetService();
    const result = await checklistSetService.updateChecklistSet(id, {
      name,
      description,
    });

    reply.code(200).send({
      success: true,
      data: {
        check_list_set_id: result.id,
        name: result.name,
        description: result.description,
        is_editable: true,
      },
    });
  } catch (error) {
    request.log.error(error);

    if (error instanceof Error) {
      if (error.message === "LINKED_REVIEW_JOBS") {
        reply.code(400).send({
          success: false,
          error:
            "このチェックリストセットは審査ジョブに紐づいているため編集できません",
          code: "LINKED_REVIEW_JOBS",
        });
        return;
      }
    }

    reply.code(500).send({
      success: false,
      error: "チェックリストセットの更新に失敗しました",
    });
  }
}

/**
 * チェックリストセット削除ハンドラー
 */
export async function deleteChecklistSetHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id } = request.params;

    const checklistSetService = new ChecklistSetService();
    await checklistSetService.deleteChecklistSet(id);

    reply.code(200).send({
      success: true,
      data: {
        deleted: true,
      },
    });
  } catch (error) {
    request.log.error(error);

    if (error instanceof Error) {
      if (error.message === "LINKED_REVIEW_JOBS") {
        reply.code(400).send({
          success: false,
          error:
            "このチェックリストセットは審査ジョブに紐づいているため削除できません",
          code: "LINKED_REVIEW_JOBS",
        });
        return;
      }
    }

    reply.code(500).send({
      success: false,
      error: "チェックリストセットの削除に失敗しました",
    });
  }
}

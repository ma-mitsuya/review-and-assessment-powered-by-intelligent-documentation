/**
 * チェックリストセット関連のハンドラー
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { ChecklistSetService, DocumentInfo } from '../services/checklist-set-service';

/**
 * チェックリストセット作成リクエストの型定義
 */
interface CreateChecklistSetRequest {
  name: string;
  description?: string;
  documents: DocumentInfo[];
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
      documents: documents || []
    });

    reply.code(200).send({
      success: true,
      data: {
        check_list_set_id: result.id,
        name: result.name,
        description: result.description,
        processing_status: 'pending'
      }
    });
  } catch (error) {
    request.log.error(error);
    
    reply.code(500).send({
      success: false,
      error: 'チェックリストセットの作成に失敗しました'
    });
  }
}

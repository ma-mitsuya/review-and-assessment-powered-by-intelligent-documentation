/**
 * 審査ドキュメント関連のハンドラー
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { ReviewDocumentService } from '../services/review-document-service';

/**
 * Presigned URL取得リクエストの型定義
 */
interface GetPresignedUrlRequest {
  filename: string;
  contentType: string;
}

/**
 * 審査ドキュメント用Presigned URL取得ハンドラー
 */
export async function getReviewPresignedUrlHandler(
  request: FastifyRequest<{ Body: GetPresignedUrlRequest }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { filename, contentType } = request.body;
    
    const documentService = new ReviewDocumentService();
    const result = await documentService.getPresignedUrl(filename, contentType);
    
    reply.code(200).send({
      success: true,
      data: result
    });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Presigned URLの生成に失敗しました'
    });
  }
}

/**
 * 審査ドキュメント削除ハンドラー
 */
export async function deleteReviewDocumentHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id } = request.params;
    const documentService = new ReviewDocumentService();

    try {
      // ドキュメントを削除
      await documentService.deleteDocument(id);
      
      reply.code(200).send({
        success: true,
        data: {
          deleted: true
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        reply.code(404).send({
          success: false,
          error: `ドキュメントが見つかりません: ${id}`
        });
      } else {
        throw error; // 他のエラーは外側のcatchブロックで処理
      }
    }
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({
      success: false,
      error: "ドキュメントの削除に失敗しました"
    });
  }
}

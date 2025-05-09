/**
 * チェックリストドキュメント関連のハンドラー
 */
import { FastifyReply, FastifyRequest } from "fastify";
import { ChecklistDocumentService } from "../services/checklist-document-service";

/**
 * Presigned URL取得リクエストの型定義
 */
interface GetPresignedUrlRequest {
  filename: string;
  contentType: string;
}

/**
 * チェックリストドキュメント用Presigned URL取得ハンドラー
 */
export async function getChecklistPresignedUrlHandler(
  request: FastifyRequest<{ Body: GetPresignedUrlRequest }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { filename, contentType } = request.body;

    const documentService = new ChecklistDocumentService();
    const result = await documentService.getPresignedUrl(filename, contentType);

    reply.code(200).send({
      success: true,
      data: result,
    });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({
      success: false,
      error: "Presigned URLの生成に失敗しました",
    });
  }
}

/**
 * チェックリストドキュメント削除ハンドラー
 */
export async function deleteChecklistDocumentHandler(
  request: FastifyRequest<{ Params: { key: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { key } = request.params;
    const documentService = new ChecklistDocumentService();

    // S3からファイルを削除
    await documentService.deleteS3File(key);

    reply.code(200).send({
      success: true,
      data: {
        deleted: true,
      },
    });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({
      success: false,
      error: "ファイルの削除に失敗しました",
    });
  }
}

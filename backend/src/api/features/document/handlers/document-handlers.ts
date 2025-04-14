/**
 * ドキュメント関連のハンドラー
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { DocumentService } from '../services/document-service';
import { generateId } from '../../checklist/utils/id-generator';
import { getPresignedUrl } from '../../../core/aws';

/**
 * Presigned URL取得リクエストの型定義
 */
interface GetPresignedUrlRequest {
  filename: string;
  contentType: string;
}

/**
 * Presigned URL取得ハンドラー
 */
export async function getPresignedUrlHandler(
  request: FastifyRequest<{ Body: GetPresignedUrlRequest }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { filename, contentType } = request.body;
    
    // ドキュメントIDの生成
    const documentId = generateId();
    
    // S3のキーを生成
    const key = `documents/original/${documentId}/${filename}`;
    
    // バケット名を取得
    const bucketName = process.env.DOCUMENT_BUCKET_NAME || 'beacon-documents';
    
    // Presigned URLを生成
    const url = await getPresignedUrl(bucketName, key, contentType);
    
    reply.code(200).send({
      success: true,
      data: {
        url,
        key,
        documentId
      }
    });
  } catch (error) {
    request.log.error(error);
    reply.code(500).send({
      success: false,
      error: 'Presigned URLの生成に失敗しました'
    });
  }
}

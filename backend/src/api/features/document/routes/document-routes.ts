/**
 * ドキュメント関連のルート定義
 */
import { FastifyInstance } from 'fastify';
import { getPresignedUrlHandler } from '../handlers/document-handlers';
import { getPresignedUrlSchema } from '../schemas/document-schemas';

/**
 * ドキュメント関連のルートを登録する
 * @param fastify Fastifyインスタンス
 */
export function registerDocumentRoutes(fastify: FastifyInstance): void {
  // Presigned URL取得
  fastify.post('/api/v1/documents/presigned-url', {
    schema: getPresignedUrlSchema,
    handler: getPresignedUrlHandler
  });
}

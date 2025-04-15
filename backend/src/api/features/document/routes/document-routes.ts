/**
 * ドキュメント関連のルート定義
 */
import { FastifyInstance } from 'fastify';
import { getPresignedUrlHandler, deleteDocumentHandler } from '../handlers/document-handlers';
import { getPresignedUrlSchema, deleteDocumentSchema } from '../schemas/document-schemas';

/**
 * ドキュメント関連のルートを登録する
 * @param fastify Fastifyインスタンス
 */
export function registerDocumentRoutes(fastify: FastifyInstance): void {
  // Presigned URL取得
  fastify.post('/api/documents/presigned-url', {
    schema: getPresignedUrlSchema,
    handler: getPresignedUrlHandler
  });

  // ドキュメント削除
  fastify.delete('/api/documents/:key', {
    schema: deleteDocumentSchema,
    handler: deleteDocumentHandler
  });
}

/**
 * ドキュメント機能のエントリーポイント
 */
import { FastifyInstance } from 'fastify';
import { registerDocumentRoutes as registerDocumentRoutesInternal } from './routes/document-routes';

/**
 * ドキュメント関連のすべてのルートを登録
 * @param fastify Fastifyインスタンス
 */
export function registerDocumentRoutes(fastify: FastifyInstance): void {
  // ドキュメント関連のルートを登録
  registerDocumentRoutesInternal(fastify);
  
  // 将来的に他のドキュメント関連ルートを追加する場合はここに記述
}

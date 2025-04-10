/**
 * Fastifyアプリケーションのエントリーポイント
 */

import fastify, { FastifyInstance } from 'fastify';
import checklistManagementRoutes from '../features/checklist-management';

/**
 * Fastifyアプリケーションの作成
 * @returns Fastifyインスタンス
 */
export function createApp(): FastifyInstance {
  const app = fastify({
    logger: true
  });

  // CORSの設定
  app.register(require('@fastify/cors'), {
    origin: '*', // 本番環境では適切に制限する
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  });

  // ヘルスチェックエンドポイント
  app.get('/health', async () => {
    return { status: 'ok' };
  });

  // 各機能のルートを登録
  app.register(checklistManagementRoutes, { prefix: '/api/v1' });

  // エラーハンドラー
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);
    reply.status(500).send({
      success: false,
      error: '内部サーバーエラーが発生しました'
    });
  });

  return app;
}

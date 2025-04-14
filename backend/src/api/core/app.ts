/**
 * Fastifyアプリケーションの作成
 */
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';

/**
 * Fastifyアプリケーションを作成する
 * @returns Fastifyインスタンス
 */
export function createApp(): FastifyInstance {
  const app = Fastify({
    logger: true
  });
  
  // CORSの設定
  app.register(cors, {
    origin: process.env.CORS_ORIGIN || '*'
  });
  
  // ヘルスチェックエンドポイント
  app.get('/health', async (_, reply) => {
    reply.code(200).send({ status: 'ok' });
  });
  
  return app;
}

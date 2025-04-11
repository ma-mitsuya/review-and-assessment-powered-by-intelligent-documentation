/**
 * BEACON バックエンドAPIのエントリーポイント
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { registerCheckListRoutes } from './features/checklist-management/routes';
import { registerCheckListItemRoutes } from './features/checklist-item-management/routes';
import { registerDocumentUploadRoutes } from './features/document-upload/routes';

// Fastifyインスタンスの作成
const fastify = Fastify({
  logger: true
});

// CORSの設定
fastify.register(cors, {
  origin: true // 開発環境では全てのオリジンを許可
});

// Prismaクライアントの初期化
const prisma = new PrismaClient();

// ルートの登録
fastify.get('/', async () => {
  return { status: 'ok', message: 'BEACON API is running' };
});

// 各機能のルートを登録
registerCheckListRoutes(fastify, prisma);
registerCheckListItemRoutes(fastify, prisma);
registerDocumentUploadRoutes(fastify, prisma);

// サーバー起動
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server is running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// プロセス終了時にPrisma接続を閉じる
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// サーバー起動
start();

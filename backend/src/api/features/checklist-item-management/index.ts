/**
 * チェックリスト項目管理機能のエントリーポイント
 */

import { FastifyInstance } from 'fastify';
import { registerCheckListItemRoutes } from './routes';
import { getPrismaClient } from '../../core/db';

/**
 * チェックリスト項目管理機能のルート登録
 * @param fastify Fastifyインスタンス
 * @param options オプション
 */
export default async function checklistItemManagementRoutes(
  fastify: FastifyInstance,
  options: any
): Promise<void> {
  // 依存関係の注入
  const prisma = getPrismaClient();
  
  // ルートの登録
  registerCheckListItemRoutes(fastify, prisma);
}

export * from './types';
export * from './repository';
export * from './service';
export * from './routes';

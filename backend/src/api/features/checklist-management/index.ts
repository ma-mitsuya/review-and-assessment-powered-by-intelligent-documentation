/**
 * チェックリスト管理機能のエントリーポイント
 */

import { FastifyInstance } from 'fastify';
import { registerCheckListSetRoutes } from './controller';
import { CheckListSetServiceImpl } from './service';
import { PrismaCheckListSetRepository, MockCheckListSetRepository } from './repository';
import { getPrismaClient } from '../../core/db';

/**
 * チェックリスト管理機能のルート登録
 * @param fastify Fastifyインスタンス
 * @param options オプション
 */
export default async function checklistManagementRoutes(
  fastify: FastifyInstance,
  options: any
): Promise<void> {
  // 依存関係の注入
  let repository;
  
  // 環境変数に基づいてリポジトリを選択
  if (process.env.USE_MOCK_DB === 'true') {
    fastify.log.info('Using mock repository for checklist management');
    repository = new MockCheckListSetRepository();
  } else {
    fastify.log.info('Using Prisma repository for checklist management');
    const prisma = getPrismaClient();
    repository = new PrismaCheckListSetRepository(prisma);
  }
  
  const service = new CheckListSetServiceImpl(repository);

  // ルートの登録
  registerCheckListSetRoutes(fastify, service);
}

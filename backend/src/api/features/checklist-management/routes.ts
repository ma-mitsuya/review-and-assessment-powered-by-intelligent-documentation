/**
 * チェックリスト管理機能のルート定義
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { PrismaCheckListSetRepository } from './repository';
import { ApiResponse } from '../../core/types';
import { CheckListSet, CreateCheckListSetRequest, UpdateCheckListSetRequest } from './types';

/**
 * チェックリスト管理機能のルートを登録する
 * @param fastify Fastifyインスタンス
 * @param prisma Prismaクライアント
 */
export function registerCheckListRoutes(fastify: FastifyInstance, prisma: PrismaClient): void {
  const repository = new PrismaCheckListSetRepository(prisma);

  // チェックリストセット一覧の取得
  fastify.get<{
    Querystring: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' };
    Reply: ApiResponse<CheckListSet[]>;
  }>('/api/checklist-sets', async (request, reply) => {
    try {
      const { page, limit, sortBy, sortOrder } = request.query;
      
      // クエリパラメータの検証
      const validatedPage = page && page > 0 ? page : 1;
      const validatedLimit = limit && limit > 0 && limit <= 100 ? limit : 10;
      
      // データの取得
      const [checkListSets, total] = await Promise.all([
        repository.getCheckListSets({ page: validatedPage, limit: validatedLimit, sortBy, sortOrder }),
        repository.countCheckListSets()
      ]);
      
      return {
        success: true,
        data: checkListSets,
        meta: {
          page: validatedPage,
          limit: validatedLimit,
          total
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'チェックリストセットの取得に失敗しました'
      });
    }
  });

  // IDによるチェックリストセットの取得
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<CheckListSet>;
  }>('/api/checklist-sets/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const checkListSet = await repository.getCheckListSetById(id);
      
      if (!checkListSet) {
        return reply.status(404).send({
          success: false,
          error: 'チェックリストセットが見つかりません'
        });
      }
      
      return {
        success: true,
        data: checkListSet
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'チェックリストセットの取得に失敗しました'
      });
    }
  });
}

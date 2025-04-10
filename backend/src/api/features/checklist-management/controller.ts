/**
 * チェックリストセット関連のコントローラ層
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CheckListSetService } from './service';
import { GetCheckListSetsParams } from './types';
import { ApiResponse } from '../../core/types';

/**
 * チェックリストセット関連のルート定義
 * @param fastify Fastifyインスタンス
 * @param service チェックリストセットサービス
 */
export function registerCheckListSetRoutes(
  fastify: FastifyInstance,
  service: CheckListSetService
): void {
  // チェックリストセット一覧の取得
  fastify.get<{
    Querystring: GetCheckListSetsParams;
    Reply: ApiResponse<{
      checkListSets: any[];
      total: number;
    }>;
  }>('/checklist-sets', async (request, reply) => {
    try {
      const { page = 1, limit = 10 } = request.query;
      
      const result = await service.getCheckListSets({
        page: Number(page),
        limit: Number(limit)
      });

      return reply.code(200).send({
        success: true,
        data: result
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'チェックリストセットの取得に失敗しました'
      });
    }
  });

  // IDによるチェックリストセットの取得
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<any>;
  }>('/checklist-sets/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const checkListSet = await service.getCheckListSetById(id);

      if (!checkListSet) {
        return reply.code(404).send({
          success: false,
          error: '指定されたチェックリストセットが見つかりません'
        });
      }

      return reply.code(200).send({
        success: true,
        data: checkListSet
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'チェックリストセットの取得に失敗しました'
      });
    }
  });
}

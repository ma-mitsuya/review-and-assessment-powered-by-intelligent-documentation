/**
 * チェックリスト管理機能のルート定義
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { PrismaCheckListSetRepository } from './repository';
import { CheckListSetServiceImpl } from './service';
import { ApiResponse } from '../../core/types';
import { CheckListSet, CreateCheckListSetRequest, UpdateCheckListSetRequest } from './types';

/**
 * チェックリスト管理機能のルートを登録する
 * @param fastify Fastifyインスタンス
 * @param prisma Prismaクライアント
 */
export function registerCheckListRoutes(fastify: FastifyInstance, prisma: PrismaClient): void {
  const repository = new PrismaCheckListSetRepository(prisma);
  const service = new CheckListSetServiceImpl(repository);

  // チェックリストセット一覧の取得
  fastify.get<{
    Querystring: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' };
    Reply: ApiResponse<CheckListSet[]>;
  }>('/api/checklist-sets', async (request, reply) => {
    try {
      const { page, limit, sortBy, sortOrder } = request.query;
      
      // クエリパラメータの検証と数値型への変換
      const validatedPage = page && Number(page) > 0 ? Number(page) : 1;
      const validatedLimit = limit && Number(limit) > 0 && Number(limit) <= 100 ? Number(limit) : 10;
      
      // データの取得
      const { checkListSets, total } = await service.getCheckListSets({ 
        page: validatedPage, 
        limit: validatedLimit, 
        sortBy, 
        sortOrder 
      });
      
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
      const checkListSet = await service.getCheckListSetById(id);
      
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
  
  // チェックリストセットの作成
  fastify.post<{
    Body: CreateCheckListSetRequest;
    Reply: ApiResponse<CheckListSet>;
  }>('/api/checklist-sets', async (request, reply) => {
    try {
      const checkListSet = await service.createCheckListSet(request.body);
      
      return reply.status(201).send({
        success: true,
        data: checkListSet
      });
    } catch (error) {
      fastify.log.error(error);
      
      // バリデーションエラーの場合は400を返す
      if (error instanceof Error && error.message.includes('必須')) {
        return reply.status(400).send({
          success: false,
          error: error.message
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'チェックリストセットの作成に失敗しました'
      });
    }
  });
  
  // チェックリストセットの更新
  fastify.put<{
    Params: { id: string };
    Body: UpdateCheckListSetRequest;
    Reply: ApiResponse<CheckListSet>;
  }>('/api/checklist-sets/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const checkListSet = await service.updateCheckListSet(id, request.body);
      
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
      
      // バリデーションエラーの場合は400を返す
      if (error instanceof Error && error.message.includes('空にできません')) {
        return reply.status(400).send({
          success: false,
          error: error.message
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'チェックリストセットの更新に失敗しました'
      });
    }
  });
  
  // チェックリストセットの削除
  fastify.delete<{
    Params: { id: string };
    Reply: ApiResponse<{ deleted: boolean }>;
  }>('/api/checklist-sets/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const deleted = await service.deleteCheckListSet(id);
      
      if (!deleted) {
        return reply.status(404).send({
          success: false,
          error: 'チェックリストセットが見つかりません'
        });
      }
      
      return {
        success: true,
        data: { deleted: true }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'チェックリストセットの削除に失敗しました'
      });
    }
  });
}

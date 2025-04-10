/**
 * チェックリスト項目管理機能のルート定義
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { PrismaCheckListItemRepository } from './repository';
import { CheckListItemService, CheckListItemServiceImpl } from './service';
import { ApiResponse } from '../../core/types';
import { CheckListItem, CreateCheckListItemRequest, UpdateCheckListItemRequest, GetCheckListItemsParams } from './types';

/**
 * チェックリスト項目管理機能のルートを登録する
 * @param fastify Fastifyインスタンス
 * @param prisma Prismaクライアント
 * @param serviceOverride テスト用のサービスオーバーライド
 */
export function registerCheckListItemRoutes(
  fastify: FastifyInstance, 
  prisma: PrismaClient,
  serviceOverride?: CheckListItemService
): void {
  // サービスの初期化 - テスト用のオーバーライドがあれば使用
  const repository = new PrismaCheckListItemRepository(prisma);
  const service = serviceOverride || new CheckListItemServiceImpl(repository);

  // チェックリスト項目一覧の取得
  fastify.get<{
    Params: { id: string };
    Querystring: Omit<GetCheckListItemsParams, 'checkListSetId'>;
    Reply: ApiResponse<CheckListItem[]>;
  }>('/api/checklist-sets/:id/items', async (request, reply) => {
    try {
      const { page, limit, sortBy, sortOrder, parentId, itemType } = request.query;
      const { id } = request.params;
      
      // クエリパラメータの検証と数値型への変換
      const validatedPage = page && Number(page) > 0 ? Number(page) : 1;
      const validatedLimit = limit && Number(limit) > 0 && Number(limit) <= 100 ? Number(limit) : 10;
      
      // データの取得
      const { checkListItems, total } = await service.getCheckListItems({ 
        page: validatedPage, 
        limit: validatedLimit, 
        sortBy, 
        sortOrder,
        checkListSetId: id,
        parentId,
        itemType
      });
      
      return {
        success: true,
        data: checkListItems,
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
        error: 'チェックリスト項目の取得に失敗しました'
      });
    }
  });

  // チェックリスト項目の階層構造取得
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<CheckListItem[]>;
  }>('/api/checklist-sets/:id/items/hierarchy', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const checkListItems = await service.getCheckListItemsHierarchy(id);
      
      return {
        success: true,
        data: checkListItems
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'チェックリスト項目の階層構造取得に失敗しました'
      });
    }
  });

  // IDによるチェックリスト項目の取得
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<CheckListItem>;
  }>('/api/checklist-items/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const checkListItem = await service.getCheckListItemById(id);
      
      if (!checkListItem) {
        return reply.status(404).send({
          success: false,
          error: 'チェックリスト項目が見つかりません'
        });
      }
      
      return {
        success: true,
        data: checkListItem
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'チェックリスト項目の取得に失敗しました'
      });
    }
  });
  
  // チェックリスト項目の作成
  fastify.post<{
    Params: { id: string };
    Body: Omit<CreateCheckListItemRequest, 'checkListSetId'>;
    Reply: ApiResponse<CheckListItem>;
  }>('/api/checklist-sets/:id/items', async (request, reply) => {
    try {
      const { id } = request.params;
      const checkListItem = await service.createCheckListItem({
        ...request.body,
        checkListSetId: id
      });
      
      return reply.status(201).send({
        success: true,
        data: checkListItem
      });
    } catch (error) {
      fastify.log.error(error);
      
      // バリデーションエラーの場合は400を返す
      if (error instanceof Error && (
        error.message.includes('必須') || 
        error.message.includes('空にできません')
      )) {
        return reply.status(400).send({
          success: false,
          error: error.message
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'チェックリスト項目の作成に失敗しました'
      });
    }
  });
  
  // チェックリスト項目の更新
  fastify.put<{
    Params: { id: string };
    Body: UpdateCheckListItemRequest;
    Reply: ApiResponse<CheckListItem>;
  }>('/api/checklist-items/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const checkListItem = await service.updateCheckListItem(id, request.body);
      
      if (!checkListItem) {
        return reply.status(404).send({
          success: false,
          error: 'チェックリスト項目が見つかりません'
        });
      }
      
      return {
        success: true,
        data: checkListItem
      };
    } catch (error) {
      fastify.log.error(error);
      
      // バリデーションエラーの場合は400を返す
      if (error instanceof Error && (
        error.message.includes('必須') || 
        error.message.includes('空にできません')
      )) {
        return reply.status(400).send({
          success: false,
          error: error.message
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'チェックリスト項目の更新に失敗しました'
      });
    }
  });
  
  // チェックリスト項目の削除
  fastify.delete<{
    Params: { id: string };
    Reply: ApiResponse<{ deleted: boolean }>;
  }>('/api/checklist-items/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const deleted = await service.deleteCheckListItem(id);
      
      if (!deleted) {
        return reply.status(404).send({
          success: false,
          error: 'チェックリスト項目が見つかりません'
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
        error: 'チェックリスト項目の削除に失敗しました'
      });
    }
  });
}

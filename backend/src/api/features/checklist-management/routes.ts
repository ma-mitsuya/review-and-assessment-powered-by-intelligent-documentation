/**
 * チェックリスト管理機能のルート定義
 */

import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { PrismaCheckListSetRepository } from "./repository";
import { CheckListSetServiceImpl } from "./service";
import { ApiResponse } from "../../core/types";
import {
  CheckListSet,
  CreateCheckListSetRequest,
  UpdateCheckListSetRequest,
  GetPresignedUrlRequest,
  PresignedUrlResponse,
  StartProcessingRequest,
  Document
} from "./types";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { PrismaDocumentRepository } from "./document-repository";
import { DocumentServiceImpl } from "./document-service";

/**
 * チェックリスト管理機能のルートを登録する
 * @param fastify Fastifyインスタンス
 * @param prisma Prismaクライアント
 */
export function registerCheckListRoutes(
  fastify: FastifyInstance,
  prisma: PrismaClient
): void {
  const repository = new PrismaCheckListSetRepository(prisma);
  const service = new CheckListSetServiceImpl(repository);

  const documentRepository = new PrismaDocumentRepository(prisma);
  const documentService = new DocumentServiceImpl(
    documentRepository,
    process.env.DOCUMENT_BUCKET,
    process.env.AWS_REGION,
    process.env.STATE_MACHINE_ARN
  );

  // チェックリストセット一覧の取得
  fastify.get<{
    Querystring: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    };
    Reply: ApiResponse<CheckListSet[]>;
  }>("/api/checklists", async (request, reply) => {
    try {
      const { page = 1, limit = 10, sortBy = "created_at", sortOrder = "desc" } = request.query;
      
      const checkListSets = await service.getCheckListSets({
        page,
        limit,
        sortBy,
        sortOrder,
      });
      
      return {
        success: true,
        data: checkListSets,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: "チェックリストセット一覧の取得に失敗しました",
      });
    }
  });

  // チェックリストセットの取得
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<CheckListSet>;
  }>("/api/checklists/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const checkListSet = await service.getCheckListSetById(id);
      
      if (!checkListSet) {
        return reply.status(404).send({
          success: false,
          error: "チェックリストセットが見つかりません",
        });
      }
      
      return {
        success: true,
        data: checkListSet,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: "チェックリストセットの取得に失敗しました",
      });
    }
  });

  // チェックリストセットの作成
  fastify.post<{
    Body: CreateCheckListSetRequest;
    Reply: ApiResponse<CheckListSet>;
  }>("/api/checklists", async (request, reply) => {
    try {
      const checkListSet = await service.createCheckListSet(request.body);

      return reply.status(201).send({
        success: true,
        data: checkListSet,
      });
    } catch (error) {
      fastify.log.error(error);

      // バリデーションエラーの場合は400を返す
      if (error instanceof Error && error.message.includes("必須")) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        });
      }

      return reply.status(500).send({
        success: false,
        error: "チェックリストセットの作成に失敗しました",
      });
    }
  });

  // チェックリストセットの更新
  fastify.put<{
    Params: { id: string };
    Body: UpdateCheckListSetRequest;
    Reply: ApiResponse<CheckListSet>;
  }>("/api/checklists/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const checkListSet = await service.updateCheckListSet(id, request.body);

      if (!checkListSet) {
        return reply.status(404).send({
          success: false,
          error: "チェックリストセットが見つかりません",
        });
      }

      return {
        success: true,
        data: checkListSet,
      };
    } catch (error) {
      fastify.log.error(error);

      // バリデーションエラーの場合は400を返す
      if (error instanceof Error && error.message.includes("空にできません")) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        });
      }

      return reply.status(500).send({
        success: false,
        error: "チェックリストセットの更新に失敗しました",
      });
    }
  });

  // チェックリストセットの削除
  fastify.delete<{
    Params: { id: string };
    Reply: ApiResponse<{ deleted: boolean }>;
  }>("/api/checklists/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const deleted = await service.deleteCheckListSet(id);

      if (!deleted) {
        return reply.status(404).send({
          success: false,
          error: "チェックリストセットが見つかりません",
        });
      }

      return {
        success: true,
        data: { deleted: true },
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: "チェックリストセットの削除に失敗しました",
      });
    }
  });

  // ドキュメントアップロード用のPresigned URL取得
  fastify.post<{
    Body: GetPresignedUrlRequest;
    Reply: ApiResponse<PresignedUrlResponse>;
  }>("/api/checklists/uploads/presigned-url", async (request, reply) => {
    try {
      const presignedUrl = await documentService.getPresignedUrl(request.body);
      
      return {
        success: true,
        data: presignedUrl,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: "Presigned URLの生成に失敗しました",
      });
    }
  });
  
  // 複数ファイルのPresigned URL取得
  fastify.post<{
    Body: GetPresignedUrlRequest[];
    Reply: ApiResponse<PresignedUrlResponse[]>;
  }>("/api/checklists/uploads/presigned-urls", async (request, reply) => {
    try {
      const presignedUrls = await documentService.getMultiplePresignedUrls(request.body);
      
      return {
        success: true,
        data: presignedUrls,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: "Presigned URLの生成に失敗しました",
      });
    }
  });
  
  // ドキュメント処理開始
  fastify.post<{
    Params: { id: string };
    Body: { fileName: string };
    Reply: ApiResponse<{ started: boolean }>;
  }>("/api/checklists/uploads/:id/process", async (request, reply) => {
    try {
      const { id } = request.params;
      const { fileName } = request.body;
      const started = await documentService.startDocumentProcessing(id, fileName);
      
      return {
        success: started,
        data: { started },
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: "ドキュメント処理の開始に失敗しました",
      });
    }
  });
  
  // ドキュメントステータス取得
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<Document>;
  }>("/api/checklists/uploads/:id/status", async (request, reply) => {
    try {
      const { id } = request.params;
      const document = await documentService.getDocumentStatus(id);
      
      if (!document) {
        return reply.status(404).send({
          success: false,
          error: "ドキュメントが見つかりません",
        });
      }
      
      return {
        success: true,
        data: document,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: "ドキュメントステータスの取得に失敗しました",
      });
    }
  });
  
  // チェックリストセットに紐づくドキュメント一覧取得
  fastify.get<{
    Params: { checklistId: string };
    Reply: ApiResponse<Document[]>;
  }>("/api/checklists/:checklistId/documents", async (request, reply) => {
    try {
      const { checklistId } = request.params;
      const documents = await documentRepository.getDocumentsByCheckListSetId(checklistId);
      
      return {
        success: true,
        data: documents,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: "ドキュメント一覧の取得に失敗しました",
      });
    }
  });
}

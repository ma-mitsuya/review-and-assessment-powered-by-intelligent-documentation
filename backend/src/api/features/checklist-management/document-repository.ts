/**
 * チェックリスト管理機能のドキュメントリポジトリ層
 */

import { PrismaClient } from "@prisma/client";
import { Document, DocumentStatus } from "./types";
import { ulid } from "ulid";
import { getFileType } from "../../../core/utils/file";

/**
 * ドキュメントリポジトリのインターフェース
 */
export interface DocumentRepository {
  /**
   * ドキュメントを作成する
   * @param params ドキュメント作成パラメータ
   * @returns 作成されたドキュメント
   */
  createDocument(params: {
    filename: string;
    s3Path: string;
    checkListSetId?: string;
    userId?: string;
  }): Promise<Document>;
  
  /**
   * IDによるドキュメントの取得
   * @param documentId ドキュメントID
   * @returns ドキュメント、存在しない場合はnull
   */
  getDocumentById(documentId: string): Promise<Document | null>;
  
  /**
   * ドキュメントのステータスを更新する
   * @param documentId ドキュメントID
   * @param status 新しいステータス
   * @returns 更新されたドキュメント、存在しない場合はnull
   */
  updateDocumentStatus(
    documentId: string,
    status: DocumentStatus
  ): Promise<Document | null>;
  
  /**
   * チェックリストセットIDによるドキュメントの取得
   * @param checkListSetId チェックリストセットID
   * @returns ドキュメントの配列
   */
  getDocumentsByCheckListSetId(
    checkListSetId: string
  ): Promise<Document[]>;
}

/**
 * Prismaを使用したドキュメントリポジトリの実装
 */
export class PrismaDocumentRepository implements DocumentRepository {
  constructor(private readonly prisma: PrismaClient) {}
  
  async createDocument(params: {
    filename: string;
    s3Path: string;
    checkListSetId?: string;
    userId?: string;
  }): Promise<Document> {
    const { filename, s3Path, checkListSetId, userId } = params;
    const fileType = getFileType(filename);
    const documentId = ulid();
    
    const document = await this.prisma.document.create({
      data: {
        document_id: documentId,
        filename,
        s3_path: s3Path,
        file_type: fileType,
        status: "pending",
        check_list_set_id: checkListSetId,
        user_id: userId,
      },
    });
    
    return {
      document_id: document.document_id,
      filename: document.filename,
      s3_path: document.s3_path,
      file_type: document.file_type,
      upload_date: document.created_at.toISOString(),
      check_list_set_id: document.check_list_set_id || undefined,
      user_id: document.user_id || undefined,
      status: document.status as DocumentStatus,
    };
  }
  
  async getDocumentById(documentId: string): Promise<Document | null> {
    const document = await this.prisma.document.findUnique({
      where: {
        document_id: documentId,
      },
    });
    
    if (!document) {
      return null;
    }
    
    return {
      document_id: document.document_id,
      filename: document.filename,
      s3_path: document.s3_path,
      file_type: document.file_type,
      upload_date: document.created_at.toISOString(),
      check_list_set_id: document.check_list_set_id || undefined,
      user_id: document.user_id || undefined,
      status: document.status as DocumentStatus,
    };
  }
  
  async updateDocumentStatus(
    documentId: string,
    status: DocumentStatus
  ): Promise<Document | null> {
    try {
      const document = await this.prisma.document.update({
        where: {
          document_id: documentId,
        },
        data: {
          status,
        },
      });
      
      return {
        document_id: document.document_id,
        filename: document.filename,
        s3_path: document.s3_path,
        file_type: document.file_type,
        upload_date: document.created_at.toISOString(),
        check_list_set_id: document.check_list_set_id || undefined,
        user_id: document.user_id || undefined,
        status: document.status as DocumentStatus,
      };
    } catch (error) {
      console.error("ドキュメントステータス更新エラー:", error);
      return null;
    }
  }
  
  async getDocumentsByCheckListSetId(
    checkListSetId: string
  ): Promise<Document[]> {
    const documents = await this.prisma.document.findMany({
      where: {
        check_list_set_id: checkListSetId,
      },
      orderBy: {
        created_at: "desc",
      },
    });
    
    return documents.map((document) => ({
      document_id: document.document_id,
      filename: document.filename,
      s3_path: document.s3_path,
      file_type: document.file_type,
      upload_date: document.created_at.toISOString(),
      check_list_set_id: document.check_list_set_id || undefined,
      user_id: document.user_id || undefined,
      status: document.status as DocumentStatus,
    }));
  }
}

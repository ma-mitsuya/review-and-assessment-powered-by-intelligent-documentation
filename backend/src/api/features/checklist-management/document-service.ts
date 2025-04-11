/**
 * チェックリスト管理機能のドキュメントサービス層
 */

import { DocumentRepository } from "./document-repository";
import { Document, DocumentStatus, GetPresignedUrlRequest, PresignedUrlResponse } from "./types";
import { createPresignedUrlGenerator } from "../../../core/utils/presigned-url";
import { getOriginalDocumentKey } from "../../../features/common/storage-paths";
import { ulid } from "ulid";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

/**
 * ドキュメントアップロードサービスのインターフェース
 */
export interface DocumentService {
  /**
   * Presigned URLを取得する
   * @param request Presigned URL取得リクエスト
   * @returns Presigned URLレスポンス
   */
  getPresignedUrl(request: GetPresignedUrlRequest): Promise<PresignedUrlResponse>;
  
  /**
   * 複数のPresigned URLを取得する
   * @param requests Presigned URL取得リクエストの配列
   * @returns Presigned URLレスポンスの配列
   */
  getMultiplePresignedUrls(
    requests: GetPresignedUrlRequest[]
  ): Promise<PresignedUrlResponse[]>;
  
  /**
   * ドキュメント処理を開始する
   * @param documentId ドキュメントID
   * @param fileName ファイル名
   * @returns 処理開始に成功した場合はtrue
   */
  startDocumentProcessing(documentId: string, fileName: string): Promise<boolean>;
  
  /**
   * ドキュメントのステータスを取得する
   * @param documentId ドキュメントID
   * @returns ドキュメント、存在しない場合はnull
   */
  getDocumentStatus(documentId: string): Promise<Document | null>;
  
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
}

/**
 * ドキュメントサービスの実装
 */
export class DocumentServiceImpl implements DocumentService {
  private presignedUrlGenerator;
  private sfnClient;
  private stateMachineArn: string;
  
  constructor(
    private readonly repository: DocumentRepository,
    bucketName?: string,
    region?: string,
    stateMachineArn?: string
  ) {
    this.presignedUrlGenerator = createPresignedUrlGenerator(bucketName, region);
    this.sfnClient = new SFNClient({ region: region || process.env.AWS_REGION || "us-west-2" });
    this.stateMachineArn = stateMachineArn || process.env.STATE_MACHINE_ARN || "";
  }
  
  async getPresignedUrl(request: GetPresignedUrlRequest): Promise<PresignedUrlResponse> {
    const { filename, contentType, checkListSetId } = request;
    const documentId = ulid();
    const key = getOriginalDocumentKey(documentId, filename);
    
    const urlResult = await this.presignedUrlGenerator.generateUploadUrl(
      key,
      contentType
    );
    
    if (!urlResult.ok) {
      throw new Error(`Presigned URL生成エラー: ${urlResult.error.message}`);
    }
    
    // ドキュメントをDBに登録
    await this.repository.createDocument({
      filename,
      s3Path: key,
      checkListSetId,
    });
    
    return {
      url: urlResult.value,
      key,
      documentId,
    };
  }
  
  async getMultiplePresignedUrls(
    requests: GetPresignedUrlRequest[]
  ): Promise<PresignedUrlResponse[]> {
    const results = [];
    
    for (const request of requests) {
      const result = await this.getPresignedUrl(request);
      results.push(result);
    }
    
    return results;
  }
  
  async startDocumentProcessing(documentId: string, fileName: string): Promise<boolean> {
    try {
      // ステータスを処理中に更新
      await this.updateDocumentStatus(documentId, "processing");
      
      // Step Functions実行
      const command = new StartExecutionCommand({
        stateMachineArn: this.stateMachineArn,
        input: JSON.stringify({
          documentId,
          fileName,
        }),
      });
      
      await this.sfnClient.send(command);
      return true;
    } catch (error) {
      console.error("ドキュメント処理開始エラー:", error);
      
      // エラー時はステータスを失敗に更新
      await this.updateDocumentStatus(documentId, "failed");
      return false;
    }
  }
  
  async getDocumentStatus(documentId: string): Promise<Document | null> {
    return this.repository.getDocumentById(documentId);
  }
  
  async updateDocumentStatus(
    documentId: string,
    status: DocumentStatus
  ): Promise<Document | null> {
    return this.repository.updateDocumentStatus(documentId, status);
  }
}

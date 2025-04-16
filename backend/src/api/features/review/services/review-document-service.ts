/**
 * 審査ドキュメントサービス
 */
import { ReviewDocumentRepository } from "../repositories/review-document-repository";
import { ReviewDocumentDto } from "../types";
import { getReviewDocumentKey } from "../../../../checklist-workflow/common/storage-paths";
import { generateId } from "../../../core/utils/id-generator";
import { CoreDocumentService } from "../../../core/document/document-service";
import { deleteS3Object } from "../../../core/aws";

/**
 * 審査ドキュメントサービス
 */
export class ReviewDocumentService {
  private repository: ReviewDocumentRepository;
  private coreDocumentService: CoreDocumentService;

  constructor() {
    this.repository = new ReviewDocumentRepository();
    this.coreDocumentService = new CoreDocumentService();
  }

  /**
   * 審査ドキュメントが存在するか確認する
   * @param documentId 審査ドキュメントID
   * @returns 存在する場合はtrue、存在しない場合はfalse
   */
  async documentExists(documentId: string): Promise<boolean> {
    return this.repository.documentExists(documentId);
  }

  /**
   * 審査ドキュメントを取得する
   * @param documentId 審査ドキュメントID
   * @returns 審査ドキュメント情報
   */
  async getDocument(documentId: string): Promise<ReviewDocumentDto | null> {
    return this.repository.getDocument(documentId);
  }

  /**
   * 審査ドキュメントアップロード用のPresigned URLを取得する
   * @param filename ファイル名
   * @param contentType コンテンツタイプ
   * @returns Presigned URL情報
   * @throws エラーが発生した場合
   */
  async getPresignedUrl(
    filename: string,
    contentType: string
  ): Promise<{
    url: string;
    key: string;
    documentId: string;
  }> {
    // バケット名を取得
    const bucketName = process.env.DOCUMENT_BUCKET_NAME || "beacon-documents";
    
    return this.coreDocumentService.getPresignedUrl(
      bucketName,
      getReviewDocumentKey,
      filename,
      contentType
    );
  }

  /**
   * 審査ドキュメントを作成する
   * @param params 審査ドキュメント作成パラメータ
   * @returns 作成された審査ドキュメント
   */
  async createDocument(params: {
    id: string;
    filename: string;
    s3Path: string;
    fileType: string;
    userId?: string;
  }): Promise<ReviewDocumentDto> {
    return this.repository.createDocument(params);
  }

  /**
   * 審査ドキュメントを削除する
   * @param documentId 審査ドキュメントID
   * @returns 削除成功時はtrue
   * @throws ドキュメントが見つからない場合やエラーが発生した場合
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    // 審査ドキュメント情報を取得
    const document = await this.repository.getDocument(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // DBから審査ドキュメントを削除
    await this.repository.deleteDocument(documentId);

    // S3からファイルを削除
    const bucketName = process.env.DOCUMENT_BUCKET_NAME || "beacon-documents";
    await deleteS3Object(bucketName, document.s3Path);

    return true;
  }

  /**
   * S3からファイルを削除する（DBレコードなし）
   * @param s3Key S3のキー
   * @returns 削除成功時はtrue
   * @throws エラーが発生した場合
   */
  async deleteS3File(s3Key: string): Promise<boolean> {
    const bucketName = process.env.DOCUMENT_BUCKET_NAME || "beacon-documents";
    return this.coreDocumentService.deleteS3File(bucketName, s3Key);
  }

  /**
   * 審査ドキュメントのステータスを更新する
   * @param documentId 審査ドキュメントID
   * @param status 新しいステータス
   * @returns 更新された審査ドキュメント
   */
  async updateDocumentStatus(
    documentId: string,
    status: string
  ): Promise<ReviewDocumentDto> {
    return this.repository.updateDocumentStatus(documentId, status);
  }
}

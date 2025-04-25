/**
 * ドキュメント関連のサービス
 */
import { DocumentRepository } from "../repositories/document-repository";
import { deleteS3Object } from "../../../core/aws";

/**
 * ドキュメントサービス
 */
export class DocumentService {
  private repository: DocumentRepository;

  constructor() {
    this.repository = new DocumentRepository();
  }

  /**
   * ドキュメントが存在するか確認する
   * @param documentId ドキュメントID
   * @returns 存在する場合はtrue、存在しない場合はfalse
   */
  async documentExists(documentId: string): Promise<boolean> {
    return this.repository.documentExists(documentId);
  }

  /**
   * ドキュメントを取得する
   * @param documentId ドキュメントID
   * @returns ドキュメント情報
   */
  async getDocument(documentId: string) {
    return this.repository.getDocument(documentId);
  }

  /**
   * ドキュメントを削除する
   * @param documentId ドキュメントID
   * @returns 削除成功時はtrue
   * @throws ドキュメントが見つからない場合やエラーが発生した場合
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    // ドキュメント情報を取得
    const document = await this.repository.getDocument(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // DBからドキュメントを削除
    await this.repository.deleteDocument(documentId);

    // S3からファイルを削除
    const bucketName = process.env.DOCUMENT_BUCKET || "beacon-documents";
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
    const bucketName = process.env.DOCUMENT_BUCKET || "beacon-documents";
    await deleteS3Object(bucketName, s3Key);
    return true;
  }
}

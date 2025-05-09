/**
 * チェックリストドキュメントサービス
 */
import { getChecklistOriginalKey } from "../../../../checklist-workflow/common/storage-paths";
import { CoreDocumentService } from "../../../core/document/document-service";

/**
 * チェックリストドキュメントサービス
 */
export class ChecklistDocumentService {
  private coreDocumentService: CoreDocumentService;

  constructor() {
    this.coreDocumentService = new CoreDocumentService();
  }

  /**
   * チェックリストドキュメントアップロード用のPresigned URLを取得する
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
    const bucketName = process.env.DOCUMENT_BUCKET || "beacon-documents";

    return this.coreDocumentService.getPresignedUrl(
      bucketName,
      getChecklistOriginalKey,
      filename,
      contentType
    );
  }

  /**
   * S3からファイルを削除する（DBレコードなし）
   * @param s3Key S3のキー
   * @returns 削除成功時はtrue
   * @throws エラーが発生した場合
   */
  async deleteS3File(s3Key: string): Promise<boolean> {
    const bucketName = process.env.DOCUMENT_BUCKET || "beacon-documents";
    return this.coreDocumentService.deleteS3File(bucketName, s3Key);
  }
}

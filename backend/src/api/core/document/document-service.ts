/**
 * ドキュメント処理の共通サービス
 */
import { getPresignedUrl as getS3PresignedUrl, deleteS3Object } from '../aws';
import { generateId } from '../utils/id-generator';

export class CoreDocumentService {
  /**
   * S3へのアップロード用のPresigned URLを取得する
   * @param bucketName S3バケット名
   * @param keyGenerator キー生成関数
   * @param filename ファイル名
   * @param contentType コンテンツタイプ
   * @returns Presigned URL、S3キー、ドキュメントID
   */
  async getPresignedUrl(
    bucketName: string,
    keyGenerator: (documentId: string, filename: string) => string,
    filename: string,
    contentType: string
  ): Promise<{ url: string; key: string; documentId: string }> {
    const documentId = generateId();
    const key = keyGenerator(documentId, filename);
    const url = await getS3PresignedUrl(bucketName, key, contentType);

    return { url, key, documentId };
  }

  /**
   * S3からファイルを削除する
   * @param bucketName S3バケット名
   * @param key S3オブジェクトキー
   * @returns 削除結果
   */
  async deleteS3File(bucketName: string, key: string): Promise<boolean> {
    await deleteS3Object(bucketName, key);
    return true;
  }
}

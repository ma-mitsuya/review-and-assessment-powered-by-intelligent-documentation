import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Result, ok, err } from "./result";

/**
 * S3 Presigned URL生成ユーティリティ
 */
export class PresignedUrlGenerator {
  private client: S3Client;
  private bucketName: string;

  /**
   * S3 Presigned URL生成ユーティリティを初期化
   *
   * @param bucketName S3バケット名
   * @param region AWSリージョン
   */
  constructor(bucketName: string, region?: string) {
    this.client = new S3Client({
      region: region || process.env.AWS_REGION || "us-west-2",
    });
    this.bucketName = bucketName;
  }

  /**
   * アップロード用のPresigned URLを生成
   * 
   * @param key S3オブジェクトキー
   * @param contentType コンテンツタイプ
   * @param expiresIn 有効期限（秒）
   * @returns Presigned URL
   */
  async generateUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<Result<string, Error>> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return ok(url);
    } catch (error) {
      console.error("Presigned URL生成エラー:", error);
      return err(
        error instanceof Error
          ? error
          : new Error("Presigned URLの生成中にエラーが発生しました")
      );
    }
  }

  /**
   * ダウンロード用のPresigned URLを生成
   * 
   * @param key S3オブジェクトキー
   * @param expiresIn 有効期限（秒）
   * @returns Presigned URL
   */
  async generateDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<Result<string, Error>> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return ok(url);
    } catch (error) {
      console.error("Presigned URL生成エラー:", error);
      return err(
        error instanceof Error
          ? error
          : new Error("Presigned URLの生成中にエラーが発生しました")
      );
    }
  }
}

/**
 * S3 Presigned URL生成ユーティリティを作成
 * 
 * @param bucketName S3バケット名
 * @param region AWSリージョン
 * @returns PresignedUrlGenerator
 */
export function createPresignedUrlGenerator(
  bucketName?: string,
  region?: string
): PresignedUrlGenerator {
  bucketName = bucketName || process.env.DOCUMENT_BUCKET || "";
  return new PresignedUrlGenerator(bucketName, region);
}

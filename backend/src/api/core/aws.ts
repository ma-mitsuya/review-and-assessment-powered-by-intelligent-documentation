/**
 * AWS関連のユーティリティ
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3クライアントのシングルトンインスタンス
let s3Client: S3Client | null = null;

/**
 * S3クライアントを取得する
 * @returns S3クライアントインスタンス
 */
export function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-northeast-1'
    });
  }
  return s3Client;
}

/**
 * S3のPresigned URLを生成する
 * @param bucket バケット名
 * @param key オブジェクトキー
 * @param contentType コンテンツタイプ
 * @param expiresIn 有効期限（秒）
 * @returns Presigned URL
 */
export async function getPresignedUrl(
  bucket: string,
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType
  });
  
  return getSignedUrl(client, command, { expiresIn });
}

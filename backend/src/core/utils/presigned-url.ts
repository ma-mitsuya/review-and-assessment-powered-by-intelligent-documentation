/**
 * Presigned URL生成ユーティリティ
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Presigned URL生成関数の型
 */
export type PresignedUrlGenerator = (key: string, contentType: string) => Promise<string>;

/**
 * Presigned URL生成関数を作成する
 * @param bucketName S3バケット名
 * @param region AWSリージョン
 * @param expiresIn 有効期限（秒）
 * @returns Presigned URL生成関数
 */
export function createPresignedUrlGenerator(
  bucketName: string,
  region: string = 'ap-northeast-1',
  expiresIn: number = 3600
): PresignedUrlGenerator {
  const s3Client = new S3Client({ region });

  return async (key: string, contentType: string): Promise<string> => {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  };
}

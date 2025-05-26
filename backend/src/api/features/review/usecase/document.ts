import { getDownloadPresignedUrl } from "../../../core/s3";

interface GetDocumentDownloadUrlParams {
  key: string;
  expiresIn?: number;
}

/**
 * ドキュメントのダウンロード用Presigned URLを取得する
 */
export async function getDocumentDownloadUrl(
  params: GetDocumentDownloadUrlParams
): Promise<string> {
  const { key, expiresIn = 3600 } = params;
  const bucketName = process.env.DOCUMENT_BUCKET;
  
  if (!bucketName) {
    throw new Error("Document bucket name is not defined");
  }
  
  return getDownloadPresignedUrl(bucketName, key, expiresIn);
}

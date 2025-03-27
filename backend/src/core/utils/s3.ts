import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Result, ok, err } from "./result";

/**
 * S3操作のユーティリティクラス
 */
export class S3Utils {
  private client: S3Client;
  private bucketName: string;

  /**
   * S3ユーティリティを初期化
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
   * オブジェクトをS3にアップロード
   *
   * @param key オブジェクトキー
   * @param body オブジェクトの内容
   * @param contentType コンテンツタイプ
   * @returns アップロード結果
   */
  async uploadObject(
    key: string,
    body: string | Buffer | Uint8Array,
    contentType?: string
  ): Promise<Result<void, Error>> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: body,
          ContentType: contentType,
        })
      );

      return ok(undefined);
    } catch (error) {
      console.error("S3アップロードエラー:", error);
      return err(
        error instanceof Error
          ? error
          : new Error("S3アップロード中にエラーが発生しました")
      );
    }
  }

  /**
   * S3からオブジェクトを取得
   *
   * @param key オブジェクトキー
   * @returns オブジェクトの内容
   */
  async getObject(key: string): Promise<Result<Buffer, Error>> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );

      if (!response.Body) {
        return err(new Error("オブジェクトの本文が空です"));
      }

      // レスポンスボディをBufferに変換
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }

      return ok(Buffer.concat(chunks));
    } catch (error) {
      console.error("S3取得エラー:", error);
      return err(
        error instanceof Error
          ? error
          : new Error("S3からの取得中にエラーが発生しました")
      );
    }
  }

  /**
   * S3からオブジェクトを削除
   *
   * @param key オブジェクトキー
   * @returns 削除結果
   */
  async deleteObject(key: string): Promise<Result<void, Error>> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );

      return ok(undefined);
    } catch (error) {
      console.error("S3削除エラー:", error);
      return err(
        error instanceof Error
          ? error
          : new Error("S3からの削除中にエラーが発生しました")
      );
    }
  }

  /**
   * JSONオブジェクトをS3に保存
   *
   * @param key オブジェクトキー
   * @param data 保存するデータ
   * @returns 保存結果
   */
  async saveJson<T>(key: string, data: T): Promise<Result<void, Error>> {
    try {
      const jsonString = JSON.stringify(data);
      return await this.uploadObject(key, jsonString, "application/json");
    } catch (error) {
      console.error("JSONの保存エラー:", error);
      return err(
        error instanceof Error
          ? error
          : new Error("JSONの保存中にエラーが発生しました")
      );
    }
  }

  /**
   * S3からJSONオブジェクトを取得
   *
   * @param key オブジェクトキー
   * @returns 取得したJSONデータ
   */
  async getJson<T>(key: string): Promise<Result<T, Error>> {
    try {
      const result = await this.getObject(key);

      if (!result.ok) {
        return err(result.error);
      }

      const jsonString = result.value.toString("utf-8");
      const data = JSON.parse(jsonString) as T;

      return ok(data);
    } catch (error) {
      console.error("JSONの取得エラー:", error);
      return err(
        error instanceof Error
          ? error
          : new Error("JSONの取得中にエラーが発生しました")
      );
    }
  }
}

export function createS3Utils(bucketName?: string, region?: string): S3Utils {
  bucketName = bucketName || process.env.DOCUMENT_BUCKET || "";
  return new S3Utils(bucketName, region);
}

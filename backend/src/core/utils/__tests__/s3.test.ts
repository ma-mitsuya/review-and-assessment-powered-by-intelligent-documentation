import {
  CreateBucketCommand,
  DeleteBucketCommand,
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { S3Utils } from "../s3"; // adjust import path
import { nanoid } from "nanoid";

const REGION = "ap-northeast-1";
let testBucketName: string;
let s3: S3Utils;
const rawClient = new S3Client({ region: REGION });

describe("S3Utils with temporary bucket", () => {
  beforeAll(async () => {
    testBucketName = `s3utils-test-${nanoid().toLowerCase()}`;
    await rawClient.send(
      new CreateBucketCommand({
        Bucket: testBucketName,
      })
    );

    // 必要に応じてバケット作成直後の wait（リージョンによっては不要）
    s3 = new S3Utils(testBucketName, REGION);
  });

  afterAll(async () => {
    // バケット内の全オブジェクトを削除
    const listed = await rawClient.send(
      new ListObjectsV2Command({ Bucket: testBucketName })
    );

    if (listed.Contents && listed.Contents.length > 0) {
      await rawClient.send(
        new DeleteObjectsCommand({
          Bucket: testBucketName,
          Delete: {
            Objects: listed.Contents.map((item) => ({ Key: item.Key! })),
          },
        })
      );
    }

    // バケット削除
    await rawClient.send(
      new DeleteBucketCommand({
        Bucket: testBucketName,
      })
    );
  });

  it("uploadObject → getObject → deleteObject が成功する", async () => {
    const key = `test/${nanoid()}.txt`;
    const content = "Hello from temp bucket";

    const uploadResult = await s3.uploadObject(key, content, "text/plain");
    expect(uploadResult.ok).toBe(true);

    const getResult = await s3.getObject(key);
    expect(getResult.ok).toBe(true);
    if (getResult.ok) {
      expect(getResult.value.toString("utf-8")).toBe(content);
    }

    const deleteResult = await s3.deleteObject(key);
    expect(deleteResult.ok).toBe(true);
  });

  it("saveJson → getJson が成功する", async () => {
    const key = `test/${nanoid()}.json`;
    const data = { message: "test ok", value: 42 };

    const saveResult = await s3.saveJson(key, data);
    expect(saveResult.ok).toBe(true);

    const loadResult = await s3.getJson<typeof data>(key);
    expect(loadResult.ok).toBe(true);
    if (loadResult.ok) {
      expect(loadResult.value).toEqual(data);
    }

    await s3.deleteObject(key);
  });
});

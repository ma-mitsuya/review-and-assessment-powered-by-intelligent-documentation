import { describe, it, expect, vi, beforeEach } from "vitest";
import { aggregatePageResults } from "../aggregate-results";
import { createMockS3Utils, MockS3Utils } from "../../../core/utils/s3.mock";
import { ok, err, unwrapOrThrow } from "../../../core/utils/result";

const dummyCsv1 = `id,name,condition\n1,項目A,条件A`;
const dummyCsv2 = `id,name,condition\n2,項目B,条件B`;

describe("aggregatePageResults", () => {
  let mockS3: MockS3Utils;

  beforeEach(() => {
    mockS3 = createMockS3Utils();
  });

  it("複数ページのCSVを結合してアップロードする", async () => {
    // モック設定: 2ページ分のチェックリストを返す
    mockS3.getObject
      .mockResolvedValueOnce(ok(Buffer.from(dummyCsv1)))
      .mockResolvedValueOnce(ok(Buffer.from(dummyCsv2)));
    mockS3.uploadObject.mockResolvedValueOnce(ok(undefined));

    const result = await aggregatePageResults(
      {
        documentId: "doc-xyz",
        processedPages: [{ pageNumber: 1 }, { pageNumber: 2 }],
      },
      { s3: mockS3 }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.documentId).toBe("doc-xyz");
    }

    // 2ページ分の取得が呼ばれている
    expect(mockS3.getObject).toHaveBeenCalledTimes(2);

    // 結果のアップロード内容を検証
    expect(mockS3.uploadObject).toHaveBeenCalledOnce();
    const [, uploadedBuffer] = mockS3.uploadObject.mock.calls[0];
    const uploadedText = uploadedBuffer.toString("utf-8");

    expect(uploadedText).toContain("id,name,condition");
    expect(uploadedText).toContain("項目A,条件A");
    expect(uploadedText).toContain("項目B,条件B");
  });

  it("getObject が失敗したらエラーを返す", async () => {
    mockS3.getObject.mockResolvedValueOnce(err(new Error("getObject failed")));

    const result = await aggregatePageResults(
      {
        documentId: "doc-error",
        processedPages: [{ pageNumber: 1 }],
      },
      { s3: mockS3 }
    );

    expect(result.ok).toBe(false);
    expect(mockS3.uploadObject).not.toHaveBeenCalled();
  });

  it("uploadObject が失敗したらエラーを返す", async () => {
    mockS3.getObject.mockResolvedValueOnce(ok(Buffer.from(dummyCsv1)));
    mockS3.uploadObject.mockResolvedValueOnce(err(new Error("upload failed")));

    const result = await aggregatePageResults(
      {
        documentId: "doc-fail-upload",
        processedPages: [{ pageNumber: 1 }],
      },
      { s3: mockS3 }
    );

    expect(result.ok).toBe(false);
  });
});

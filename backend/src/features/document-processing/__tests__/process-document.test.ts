import { vi, describe, it, expect, beforeEach } from "vitest";
import { processDocument } from "../process-document";
import { createMockS3Utils, MockS3Utils } from "../../../core/utils/s3.mock";
import * as split from "../split-pages";
import { Buffer } from "buffer";
import { ok, err } from "../../../core/utils/result";
import { SplitPage } from "../types";
import { PDFDocument } from "pdf-lib";

// splitIntoPagesのモック
vi.mock("../split-pages");

describe("processDocument", () => {
  const documentId = "doc-1234";
  const fileName = "sample.pdf";
  const mockPdfBuffer = Buffer.from("%PDF-MOCK");

  let mockS3: MockS3Utils;

  beforeEach(() => {
    vi.clearAllMocks();

    // モックS3インスタンスを作成
    mockS3 = createMockS3Utils();

    // S3メソッドのモック実装を設定
    mockS3.getObject.mockResolvedValue(ok(mockPdfBuffer));
    mockS3.uploadObject.mockResolvedValue(ok(undefined));

    // splitIntoPagesのモックを設定
    vi.mocked(split.splitIntoPages).mockResolvedValue(
      ok([
        { pageNumber: 1, buffer: Buffer.from("%PDF-PAGE-1") },
        { pageNumber: 2, buffer: Buffer.from("%PDF-PAGE-2") },
      ] as SplitPage[])
    );
  });

  it("PDFを処理し、ページをS3にアップロードできる", async () => {
    // 関数呼び出し
    const result = await processDocument(
      { documentId, fileName },
      { s3: mockS3, pdfLib: { PDFDocument } }
    );

    // 結果の検証
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { metadata, pages, pageCount } = result.value;

    expect(metadata.documentId).toBe(documentId);
    expect(metadata.fileName).toBe(fileName);
    expect(metadata.fileType).toBe("pdf");
    expect(pageCount).toBe(2);
    expect(pages).toHaveLength(2);

    // S3の操作が正しく呼び出されたか確認
    expect(mockS3.uploadObject).toHaveBeenCalledTimes(2);
    expect(mockS3.uploadObject).toHaveBeenCalledWith(
      `pages/${documentId}/page-1.pdf`,
      expect.any(Buffer),
      "application/pdf"
    );
    expect(mockS3.uploadObject).toHaveBeenCalledWith(
      `pages/${documentId}/page-2.pdf`,
      expect.any(Buffer),
      "application/pdf"
    );

    // splitIntoPagesが正しく呼び出されたか確認
    expect(split.splitIntoPages).toHaveBeenCalled();
  });

  it("S3からのファイル取得に失敗した場合、エラーを返す", async () => {
    // getObjectがエラーを返すようにモックを設定
    mockS3.getObject.mockResolvedValue(
      err(new Error("ファイルの取得に失敗しました"))
    );

    const result = await processDocument(
      { documentId, fileName },
      { s3: mockS3, pdfLib: { PDFDocument } }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("ファイルの取得に失敗しました");
    }
  });

  it("ページ分割に失敗した場合、エラーを返す", async () => {
    // splitIntoPagesがエラーを返すようにモックを設定
    vi.mocked(split.splitIntoPages).mockResolvedValue(
      err(new Error("ページ分割に失敗しました"))
    );

    const result = await processDocument(
      { documentId, fileName },
      { s3: mockS3, pdfLib: { PDFDocument } }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("ページ分割に失敗しました");
    }
  });

  it("S3へのアップロードに失敗した場合、エラーを返す", async () => {
    // 最初のアップロードは成功、2つ目で失敗するようにモック
    mockS3.uploadObject
      .mockResolvedValueOnce(ok(undefined))
      .mockResolvedValueOnce(err(new Error("アップロードに失敗しました")));

    const result = await processDocument(
      { documentId, fileName },
      { s3: mockS3, pdfLib: { PDFDocument } }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("アップロードに失敗しました");
    }
  });

  it("テキストファイルを処理できる", async () => {
    // テキストファイルとして処理する設定
    const textFileName = "sample.txt";
    const textBuffer = Buffer.from("これはテストテキストです。");

    mockS3.getObject.mockResolvedValue(ok(textBuffer));

    // splitIntoPagesがテキストファイル用の結果を返すように設定
    vi.mocked(split.splitIntoPages).mockResolvedValue(
      ok([{ pageNumber: 1, buffer: textBuffer }] as SplitPage[])
    );

    const result = await processDocument(
      { documentId, fileName: textFileName },
      { s3: mockS3, pdfLib: { PDFDocument } }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { metadata, pageCount } = result.value;
    expect(metadata.fileType).toBe("text");
    expect(pageCount).toBe(1);
  });
});

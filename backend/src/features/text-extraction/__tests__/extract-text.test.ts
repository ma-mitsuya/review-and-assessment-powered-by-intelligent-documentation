import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import {
  extractTextFromPdf,
  extractTextFromText,
  TextExtractorDeps,
} from "../extract-text";
import { createMockS3Utils, MockS3Utils } from "../../../core/utils/s3.mock";
import { ok, unwrapOrThrow } from "../../../core/utils/result";
import { getPageExtractedTextKey } from "../../common/storage-paths";
import * as pdfjsLib from "pdfjs-dist";

// 実物PDF用のユーティリティ読み込み
pdfjsLib.GlobalWorkerOptions.workerSrc = require("pdfjs-dist/build/pdf.worker.entry");

describe("extractTextFromPdf", () => {
  let mockS3: MockS3Utils;
  let deps: TextExtractorDeps;

  const documentId = "doc-001";
  const pageNumber = 1;

  beforeEach(() => {
    const samplePdfBuffer = fs.readFileSync(
      path.resolve(__dirname, "assets/sample.pdf")
    );

    mockS3 = createMockS3Utils();
    mockS3.getObject.mockResolvedValue(ok(samplePdfBuffer));
    mockS3.uploadObject.mockResolvedValue(ok(undefined));

    deps = {
      s3: mockS3,
      pdfLib: {
        getDocument: (params: { data: Uint8Array }) =>
          pdfjsLib.getDocument(params),
      },
    };
  });

  it("PDFからテキストを抽出しS3にアップロードできる", async () => {
    const result = await extractTextFromPdf({ documentId, pageNumber }, deps);

    unwrapOrThrow(result);
    expect(result.ok).toBe(true);
  });
});

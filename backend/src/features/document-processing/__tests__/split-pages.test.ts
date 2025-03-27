import { vi, describe, it, expect, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import {
  splitPdfIntoPages,
  processImageAsPage,
  processTextAsPage,
  DocumentProcessorDeps,
} from "../split-pages";
import { unwrapOrThrow } from "../../../core/utils/result";

// 実際の依存関係を使用
const deps: DocumentProcessorDeps = {
  pdfLib: {
    PDFDocument,
  },
};

describe("splitPdfIntoPages", () => {
  it("PDFをページごとに分割できる", async () => {
    const pdfPath = path.resolve(__dirname, "assets/sample.pdf");
    const buffer = fs.readFileSync(pdfPath);

    const pages = unwrapOrThrow(await splitPdfIntoPages({ buffer }, deps));

    // 1ページ以上あることを確認
    expect(pages.length).toBeGreaterThan(0);
    for (const page of pages) {
      expect(page.pageNumber).toBeGreaterThan(0);
      expect(Buffer.isBuffer(page.buffer)).toBe(true);

      // 簡易的なPDFファイルの検証（%PDFで始まる）
      const header = page.buffer.subarray(0, 4).toString("utf-8");
      expect(header).toBe("%PDF");

      // 各ページが有効なPDFかどうか検証
      const loadedPdf = await PDFDocument.load(page.buffer);
      expect(loadedPdf.getPageCount()).toBe(1);
    }
  });

  it("空のPDFをエラーなく処理できる", async () => {
    // 空のPDFを作成
    const emptyPdf = await PDFDocument.create();
    const buffer = Buffer.from(await emptyPdf.save());

    const result = await splitPdfIntoPages({ buffer }, deps);
    expect(result.ok).toBe(true);

    const pages = unwrapOrThrow(result);
  });
});

describe("processImageAsPage", () => {
  it("PNGをPDF化して1ページに変換できる", async () => {
    const imagePath = path.resolve(__dirname, "assets/sample.png");
    const buffer = fs.readFileSync(imagePath);

    const pages = unwrapOrThrow(await processImageAsPage({ buffer }, deps));

    expect(pages).toHaveLength(1);
    expect(pages[0].pageNumber).toBe(1);
    expect(Buffer.isBuffer(pages[0].buffer)).toBe(true);

    const header = pages[0].buffer.subarray(0, 4).toString("utf-8");
    expect(header).toBe("%PDF");

    // 生成されたPDFが有効かチェック
    const loadedPdf = await PDFDocument.load(pages[0].buffer);
    expect(loadedPdf.getPageCount()).toBe(1);
  });

  it("JPGをPDF化して1ページに変換できる", async () => {
    const imagePath = path.resolve(__dirname, "assets/sample.jpg");
    if (fs.existsSync(imagePath)) {
      // ファイルが存在する場合のみテスト
      const buffer = fs.readFileSync(imagePath);

      const pages = unwrapOrThrow(await processImageAsPage({ buffer }, deps));

      expect(pages).toHaveLength(1);
      expect(pages[0].pageNumber).toBe(1);

      // 生成されたPDFが有効かチェック
      const loadedPdf = await PDFDocument.load(pages[0].buffer);
      expect(loadedPdf.getPageCount()).toBe(1);
    } else {
      console.log("Skip JPG test: sample.jpg not found");
    }
  });
});

describe("processTextAsPage", () => {
  it("テキストをそのまま1ページとして処理できる", async () => {
    const text = "これはテスト用のテキストです。\n複数行のテストも含まれます。";
    const buffer = Buffer.from(text, "utf-8");

    const pages = unwrapOrThrow(await processTextAsPage({ buffer }));

    expect(pages).toHaveLength(1);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[0].buffer.toString("utf-8")).toBe(text);
  });

  it("空のテキストも処理できる", async () => {
    const buffer = Buffer.from("", "utf-8");

    const pages = unwrapOrThrow(await processTextAsPage({ buffer }));

    expect(pages).toHaveLength(1);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[0].buffer.toString("utf-8")).toBe("");
  });
});

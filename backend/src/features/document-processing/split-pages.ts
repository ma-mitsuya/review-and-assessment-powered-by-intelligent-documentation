import { Result, ok, err } from "../../core/utils/result";
import { SplitPage } from "./types";
import { FileType } from "../../core/utils/file";
import { PDFDocument } from "pdf-lib";

export interface DocumentProcessorDeps {
  pdfLib: {
    PDFDocument: typeof PDFDocument;
  };
}

/**
 * ドキュメントをページに分割する
 *
 * @param params 入力パラメータ
 * @param deps 外部依存関係
 * @returns 分割されたページの配列
 */
export async function splitIntoPages(
  params: {
    buffer: Buffer;
    fileType: FileType;
  },
  deps: DocumentProcessorDeps
): Promise<Result<SplitPage[], Error>> {
  try {
    const { buffer, fileType } = params;

    switch (fileType) {
      case "pdf":
        return await splitPdfIntoPages({ buffer }, deps);
      case "word":
        return err(new Error("Wordファイルのページ分割は未実装です"));
      case "excel":
        return err(new Error("Excelファイルのページ分割は未実装です"));
      case "image":
        return await processImageAsPage({ buffer }, deps);
      case "text":
        return await processTextAsPage({ buffer });
      default:
        return err(new Error(`未サポートのファイルタイプ: ${fileType}`));
    }
  } catch (error) {
    return err(new Error(`ページ分割中にエラーが発生しました: ${error}`));
  }
}

/**
 * PDFをページに分割する
 */
export async function splitPdfIntoPages(
  params: { buffer: Buffer },
  deps: DocumentProcessorDeps
): Promise<Result<SplitPage[], Error>> {
  try {
    const { buffer } = params;
    const { pdfLib } = deps;

    const pdfDoc = await pdfLib.PDFDocument.load(buffer);
    const totalPages = pdfDoc.getPageCount();
    const splitPages: SplitPage[] = [];

    for (let i = 0; i < totalPages; i++) {
      const newPdf = await pdfLib.PDFDocument.create();
      const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
      newPdf.addPage(copiedPage);

      const pageBuffer = Buffer.from(await newPdf.save());

      splitPages.push({
        buffer: pageBuffer,
        pageNumber: i + 1,
      });
    }

    return ok(splitPages);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error(`PDFのページ分割中にエラーが発生しました: ${error}`)
    );
  }
}

/**
 * 画像を単一ページとして処理
 */
export async function processImageAsPage(
  params: { buffer: Buffer },
  deps: DocumentProcessorDeps
): Promise<Result<SplitPage[], Error>> {
  try {
    const { buffer } = params;
    const { pdfLib } = deps;

    const pdfDoc = await pdfLib.PDFDocument.create();

    // PNG と JPG の両方に対応
    let image;
    try {
      image = await pdfDoc.embedPng(buffer);
    } catch {
      image = await pdfDoc.embedJpg(buffer);
    }

    // 画像のオリジナルサイズを取得
    const { width, height } = image;

    // ページサイズを画像のサイズに合わせる
    const page = pdfDoc.addPage([width, height]);

    // 画像を等倍でページいっぱいに描画
    page.drawImage(image, {
      x: 0,
      y: 0,
      width,
      height,
    });

    const pdfBuffer = Buffer.from(await pdfDoc.save());

    console.log("Image dimensions:", width, height);
    console.log("Buffer size:", buffer.length);
    console.log("Output PDF size:", pdfBuffer.length);

    return ok([
      {
        buffer: pdfBuffer,
        pageNumber: 1,
      },
    ]);
  } catch (error) {
    return err(new Error(`画像PDF変換中にエラーが発生しました: ${error}`));
  }
}
// export async function processImageAsPage(
//   params: { buffer: Buffer },
//   deps: DocumentProcessorDeps
// ): Promise<Result<SplitPage[], Error>> {
//   try {
//     const { buffer } = params;
//     const { pdfLib } = deps;

//     const pdfDoc = await pdfLib.PDFDocument.create();
//     const image = await pdfDoc.embedPng(buffer); // JPGなら embedJpg
//     const { width, height } = image.scale(1);

//     const page = pdfDoc.addPage([width, height]);
//     page.drawImage(image, {
//       x: 0,
//       y: 0,
//       width,
//       height,
//     });

//     const pdfBuffer = Buffer.from(await pdfDoc.save());

//     return ok([
//       {
//         buffer: pdfBuffer,
//         pageNumber: 1,
//       },
//     ]);
//   } catch (error) {
//     return err(new Error(`画像PDF変換中にエラーが発生しました: ${error}`));
//   }
// }

/**
 * テキストファイルを単一ページとして処理
 */
export async function processTextAsPage(params: {
  buffer: Buffer;
}): Promise<Result<SplitPage[], Error>> {
  try {
    const { buffer } = params;

    return ok([
      {
        buffer,
        pageNumber: 1,
      },
    ]);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error(`テキスト処理中にエラーが発生しました: ${error}`)
    );
  }
}

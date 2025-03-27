import {
  S3Utils,
  Result,
  ok,
  err,
  allResults,
  flatMap,
  flatMapAsync,
} from "../../core/utils";
import {
  getPageCombinedKey,
  getDocumentAggregateKey,
} from "../common/storage-paths";
import { AggregatedDocumentResult } from "./type";

export async function aggregatePageResults(
  params: {
    documentId: string;
    processedPages: { pageNumber: number }[];
  },
  deps: {
    s3: S3Utils;
  }
): Promise<Result<AggregatedDocumentResult, Error>> {
  const { documentId, processedPages } = params;
  const { s3 } = deps;

  console.log(`[aggregatePageResults] 開始: documentId=${documentId}, ページ数=${processedPages.length}`);
  console.log(`[aggregatePageResults] 処理対象ページ: ${JSON.stringify(processedPages.map(p => p.pageNumber))}`);

  const pageResults = await allResults(
    processedPages.map(async ({ pageNumber }) => {
      const key = getPageCombinedKey(documentId, pageNumber);
      console.log(`[aggregatePageResults] ページ${pageNumber}の結果を取得: ${key}`);
      const res = await s3.getObject(key);
      if (!res.ok) {
        console.error(`[aggregatePageResults] ページ${pageNumber}の結果取得失敗: ${res.error.message}`);
        return err(new Error(`Failed to read: ${key}`));
      }
      console.log(`[aggregatePageResults] ページ${pageNumber}の結果取得成功: ${res.value.length}バイト`);
      return ok({ pageNumber, checklist: res.value.toString("utf-8") });
    })
  );
  
  if (!pageResults.ok) {
    console.error(`[aggregatePageResults] ページ結果の取得でエラー: ${pageResults.error.message}`);
    return err(pageResults.error);
  }

  return flatMapAsync(pageResults, async (pages) => {
    // ページ順にソート
    console.log(`[aggregatePageResults] ページ結果をソート`);
    const sorted = pages.sort((a, b) => a.pageNumber - b.pageNumber);

    // ヘッダー付きで結合（重複ヘッダー削除）
    console.log(`[aggregatePageResults] CSV形式に結合`);
    const header = "id,name,condition";
    const bodyLines = sorted.flatMap((p) =>
      p.checklist
        .split("\n")
        .filter((line) => line.trim() !== "" && line.trim() !== header)
    );

    const combinedCsv = [header, ...bodyLines].join("\n");
    console.log(`[aggregatePageResults] 結合されたCSV: ${combinedCsv.length}文字, ${bodyLines.length}行`);

    const outputKey = getDocumentAggregateKey(documentId);
    console.log(`[aggregatePageResults] 集約結果をS3に保存開始: ${outputKey}`);
    const uploadRes = await s3.uploadObject(
      outputKey,
      Buffer.from(combinedCsv, "utf-8")
    );

    if (!uploadRes.ok) {
      console.error(`[aggregatePageResults] S3への書き込み失敗: ${uploadRes.error.message}`);
      return err(new Error(`Failed to write: ${outputKey}`));
    }
    console.log(`[aggregatePageResults] S3への書き込み成功`);

    console.log(`[aggregatePageResults] 処理完了: documentId=${documentId}`);
    return ok({ documentId });
  });
}

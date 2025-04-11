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

  console.log(
    `[aggregatePageResults] 開始: documentId=${documentId}, ページ数=${processedPages.length}`
  );
  console.log(
    `[aggregatePageResults] 処理対象ページ: ${JSON.stringify(
      processedPages.map((p) => p.pageNumber)
    )}`
  );
  const key = getPageCombinedKey(documentId, pageNumber);
  console.log(`[aggregatePageResults] ページ${pageNumber}の結果を取得: ${key}`);
  const res = await s3.getObject(key);
  if (!res.ok) {
    console.error(
      `[aggregatePageResults] ページ${pageNumber}の結果取得失敗: ${res.error.message}`
    );
    return err(new Error(`Failed to read: ${key}`));
  }
  console.log(
    `[aggregatePageResults] ページ${pageNumber}の結果取得成功: ${res.value.length}バイト`
  );

  // TODO: 結合処理

  const outputKey = getDocumentAggregateKey(documentId);
  console.log(`[aggregatePageResults] 集約結果をS3に保存開始: ${outputKey}`);
  const uploadRes = await s3.uploadObject(
    outputKey,
    Buffer.from(combined, "utf-8")
  );

  if (!uploadRes.ok) {
    console.error(
      `[aggregatePageResults] S3への書き込み失敗: ${uploadRes.error.message}`
    );
    return err(new Error(`Failed to write: ${outputKey}`));
  }
  console.log(`[aggregatePageResults] S3への書き込み成功`);

  console.log(`[aggregatePageResults] 処理完了: documentId=${documentId}`);
  return ok({ documentId });
}

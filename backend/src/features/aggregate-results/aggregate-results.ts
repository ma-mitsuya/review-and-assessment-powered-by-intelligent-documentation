import { Result, S3Utils, err, ok } from "../../core/utils";
import {
  getDocumentAggregateKey,
  getPageCombinedKey,
} from "../common/storage-paths";
import { ChecklistResponse } from "../result-combining/types";
import { AggregatedDocumentResult } from "./type";

/**
 * ドキュメントの全ページの結果を集約する関数
 * @param params ドキュメントIDと処理済みページ情報
 * @param deps 依存関係（S3ユーティリティ）
 * @returns 集約結果
 */
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
    `[aggregatePageResults] 開始: documentId=${documentId}, processedPages=${processedPages.length}`
  );

  try {
    // 全ページの結果を並行して取得
    const pagePromises: Promise<Result<ChecklistResponse, Error>>[] = [];

    for (const page of processedPages) {
      pagePromises.push(fetchPageResult(documentId, page.pageNumber, s3));
    }

    const pageResults = await Promise.all(pagePromises);

    // エラーがあれば早期リターン
    const errorResult = pageResults.find((result) => !result.ok);
    if (errorResult && !errorResult.ok) {
      return err(errorResult.error);
    }

    // 全ページの結果を集約
    const aggregatedData: Record<string, ChecklistResponse[]> = {
      [documentId]: pageResults
        .filter(
          (result): result is { ok: true; value: ChecklistResponse } =>
            result.ok
        )
        .map((result) => result.value),
    };

    // 集約結果をS3に保存
    const aggregateKey = getDocumentAggregateKey(documentId);
    console.log(`[aggregatePageResults] 集約結果をS3に保存開始: ${aggregateKey}`);

    const jsonResult = JSON.stringify(aggregatedData, null, 2);
    const uploadResult = await s3.uploadObject(
      aggregateKey,
      Buffer.from(jsonResult)
    );

    if (!uploadResult.ok) {
      console.error(
        `[aggregatePageResults] S3への書き込み失敗: ${uploadResult.error.message}`
      );
      return err(
        new Error(`S3への書き込み失敗: ${uploadResult.error.message}`)
      );
    }

    console.log(`[aggregatePageResults] S3への書き込み成功`);

    return ok({
      documentId,
      aggregatedData,
    });
  } catch (error) {
    console.error(`[aggregatePageResults] エラー発生: ${(error as Error).message}`);
    return err(error as Error);
  }
}

/**
 * 特定ページの結果を取得する関数
 * @param documentId ドキュメントID
 * @param pageNumber ページ番号
 * @param s3 S3ユーティリティ
 * @returns ページの結果
 */
async function fetchPageResult(
  documentId: string,
  pageNumber: number,
  s3: S3Utils
): Promise<Result<ChecklistResponse, Error>> {
  const combinedKey = getPageCombinedKey(documentId, pageNumber);
  console.log(`[fetchPageResult] S3からデータ取得開始: ${combinedKey}`);

  try {
    const result = await s3.getObject(combinedKey);

    if (!result.ok) {
      console.error(
        `[fetchPageResult] S3からの読み込み失敗: ${result.error.message}`
      );
      return err(new Error(`S3からの読み込み失敗: ${combinedKey}`));
    }

    const content = result.value.toString("utf-8");
    const parsedData = JSON.parse(content) as ChecklistResponse;

    return ok(parsedData);
  } catch (error) {
    console.error(`[fetchPageResult] エラー発生: ${(error as Error).message}`);
    return err(error as Error);
  }
}

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

  const pageResults = await allResults(
    processedPages.map(async ({ pageNumber }) => {
      const key = getPageCombinedKey(documentId, pageNumber);
      const res = await s3.getObject(key);
      return res.ok
        ? ok({ pageNumber, checklist: res.value.toString("utf-8") })
        : err(new Error(`Failed to read: ${key}`));
    })
  );
  if (!pageResults.ok) {
    return err(pageResults.error);
  }

  return flatMapAsync(pageResults, async (pages) => {
    // ページ順にソート
    const sorted = pages.sort((a, b) => a.pageNumber - b.pageNumber);

    // ヘッダー付きで結合（重複ヘッダー削除）
    const header = "id,name,condition";
    const bodyLines = sorted.flatMap((p) =>
      p.checklist
        .split("\n")
        .filter((line) => line.trim() !== "" && line.trim() !== header)
    );

    const combinedCsv = [header, ...bodyLines].join("\n");

    const outputKey = getDocumentAggregateKey(documentId);
    const uploadRes = await s3.uploadObject(
      outputKey,
      Buffer.from(combinedCsv, "utf-8")
    );

    return uploadRes.ok
      ? ok({ documentId })
      : err(new Error(`Failed to write: ${outputKey}`));
  });
}

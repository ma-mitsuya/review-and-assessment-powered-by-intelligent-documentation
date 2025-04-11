/**
 * 集約されたドキュメント結果のインターフェース
 */
export interface AggregatedDocumentResult {
  documentId: string;
  aggregatedData: Record<string, any[]>;
}

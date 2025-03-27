/**
 * 元のドキュメントのS3キーを生成する
 */
export function getOriginalDocumentKey(
  documentId: string,
  fileName: string
): string {
  return `$raw/${documentId}/${fileName}`;
}

export function getPagePdfKey(documentId: string, pageNumber: number): string {
  return `pages/${documentId}/page-${pageNumber}.pdf`;
}

export function getPageExtractedTextKey(
  documentId: string,
  pageNumber: number
): string {
  return `pages/${documentId}/extracted-text/page-${pageNumber}.txt`;
}

export function getPageLlmOcrTextKey(
  documentId: string,
  pageNumber: number
): string {
  return `pages/${documentId}/llm-ocr/page-${pageNumber}.md`;
}

export function getPageCombinedKey(
  documentId: string,
  pageNumber: number
): string {
  return `pages/${documentId}/combined/page-${pageNumber}.csv`;
}

export function getDocumentAggregateKey(documentId: string): string {
  return `result/${documentId}/${documentId}.csv`;
}

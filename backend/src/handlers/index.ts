/**
 * Lambda ハンドラー - Step Functionsからのイベントを処理
 */
export const handler = async (event: any): Promise<any> => {
  console.log("受信イベント:", JSON.stringify(event, null, 2));

  // アクションタイプに基づいて処理を分岐
  switch (event.action) {
    case "processDocument":
      return await handleProcessDocument(event);
    case "extractText":
      return await handleExtractText(event);
    case "processWithLLM":
      return await handleProcessWithLLM(event);
    case "combinePageResults":
      return await handleCombinePageResults(event);
    case "aggregatePageResults":
      return await handleAggregatePageResults(event);
    case "handleError":
      return await handleError(event);
    default:
      throw new Error(`未知のアクション: ${event.action}`);
  }
};

# チェックリスト抽出機能の実装計画

## CDK 定義との整合性確認

CDK で定義された Step Functions(SFn)の payload と型を確認し、整合性を取った実装計画を立てます。

## 実装すべき関数と整合性

1. handleProcessDocument:
   • 入力: { documentId, fileName }
   • 出力: { documentId, pageCount, pages: [{ pageNumber }] }
   • SFn 定義と整合しています

2. handleExtractText:
   • 入力: { documentId, pageNumber }
   • 出力: テキスト抽出結果
   • SFn 定義と整合しています

3. handleProcessWithLLM:
   • 入力: { documentId, pageNumber }
   • 出力: LLM 処理結果
   • SFn 定義と整合しています

4. handleCombinePageResults:
   • 入力: parallelResults (extractText と processWithLLM の結果)
   • 出力: 結合結果
   • SFn 定義と整合しています

5. handleAggregatePageResults:
   • 入力: { documentId, processedPages }
   • 出力: 集計結果
   • SFn 定義と整合しています

## 実装計画

### 1. 型定義の作成

typescript
// document-processing/types.ts
export interface ProcessDocumentResult {
documentId: string;
pageCount: number;
pages: { pageNumber: number }[];
}

export interface ChecklistItem {
name: string;
description: string;
parent_id: number | null;
item_type: "SIMPLE" | "FLOW";
is_conclusion: boolean;
flow_data?: {
condition_type: "YES_NO" | "MULTI_CHOICE";
next_if_yes?: number;
next_if_no?: number;
next_options?: Record<string, number>;
};
}

### 2. handleProcessDocument の実装

PDF 判定、ページ分割、S3 保存を行います。

typescript
// document-processing/process-document.ts
export async function processDocument({
documentId,
fileName,
}: {
documentId: string;
fileName: string;
}): Promise<ProcessDocumentResult> {
// ファイル拡張子確認、PDF 以外はエラー
// PDF をページに分割して S3 保存
// 結果を返す
}

### 3. handleExtractText の実装

空文字列を S3 に保存するだけの処理です。

typescript
// document-processing/extract-text.ts
export async function extractText({
documentId,
pageNumber,
}: {
documentId: string;
pageNumber: number;
}): Promise<{ documentId: string; pageNumber: number; textContent: string }> {
// 空文字列を S3 に保存
}

### 4. handleProcessWithLLM の実装

Bedrock Converse API を使用してチェックリストを抽出します。

typescript
// document-processing/process-with-llm.ts
export async function processWithLLM({
documentId,
pageNumber,
}: {
documentId: string;
pageNumber: number;
}): Promise<{ documentId: string; pageNumber: number; checklistItems: ChecklistItem[] }> {
// PDF ページを S3 から取得
// Bedrock Converse API でチェックリスト抽出
// JSON パース失敗時はリトライ
// 結果を S3 に保存
}

### 5. handleCombinePageResults の実装

ProcessWithLLM の結果を別の S3 キーに保存します。

typescript
// document-processing/combine-page-results.ts
export async function combinePageResults({
parallelResults,
}: {
parallelResults: {
textExtraction: { Payload: any };
llmProcessing: { Payload: any };
};
}): Promise<{ documentId: string; pageNumber: number; checklistItems: ChecklistItem[] }> {
// LLM 処理結果を取得
// 結果を S3 に保存
}

### 6. handleAggregatePageResults の実装

各ページの結果を一つに統合します。

typescript
// document-processing/aggregate-page-results.ts
export async function aggregatePageResults({
documentId,
processedPages,
}: {
documentId: string;
processedPages: { Payload: any }[];
}): Promise<{ documentId: string; checklistItems: ChecklistItem[] }> {
// 各ページの結果を統合
// 数値 ID から ULID へ変換
// 結果を S3 に保存
}

### 7. エントリポイントの実装

typescript
// index.ts
export const handler = async (event: any): Promise<any> => {
switch (event.action) {
case "processDocument": return await handleProcessDocument(event);
case "extractText": return await handleExtractText(event);
case "processWithLLM": return await handleProcessWithLLM(event);
case "combinePageResults": return await handleCombinePageResults(event);
case "aggregatePageResults": return await handleAggregatePageResults(event);
case "handleError": return await handleError(event);
default: throw new Error(`未知のアクション: ${event.action}`);
}
};

## 実装上の注意点

1. PDF 分割: pdf-lib を使用
2. テキスト抽出: 空文字列を保存するのみ
3. LLM 処理: Bedrock Converse API 使用、JSON パース失敗時はリトライ
4. 結果統合: 各ページの結果を統合、ID の変換を適切に実施
5. エラーハンドリング: 各処理で適切に実施

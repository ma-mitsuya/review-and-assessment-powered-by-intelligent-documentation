/**
 * ドキュメント処理に関連する型定義
 */

import { FileType } from "../../core/utils/file";

/**
 * 処理ステータス
 */
export type ProcessingStatus = "pending" | "processing" | "completed" | "error";

/**
 * ドキュメントのメタデータ
 */
export interface DocumentMetadata {
  documentId: string;
  fileName: string;
  fileType: FileType;
  pageCount?: number;
  extractedAt: Date;
  processingStatus: ProcessingStatus;
}

/**
 * 処理済みページ情報
 */
export interface ProcessedPage {
  pageNumber: number;
  rawText: string; // テキスト抽出結果
  markdownContent: string; // LLMによるMarkdown変換結果
  processingStatus: ProcessingStatus;
  processedAt: Date;
}

/**
 * 処理済みドキュメント情報
 */
export interface ProcessedDocument {
  documentId: string;
  metadata: DocumentMetadata;
  pages: ProcessedPage[];
  combinedContent?: {
    rawText: string; // 全ページのテキスト結合
    markdownContent: string; // 全ページのMarkdown結合
    processedAt: Date;
  };
}

/**
 * ページ分割結果
 */
export interface SplitPage {
  buffer: Buffer; // ページのバイナリデータ
  pageNumber: number; // ページ番号
}

/**
 * ドキュメント処理結果
 */
export interface DocumentProcessResult {
  documentId: string;
  metadata: DocumentMetadata;
  pages: {
    pageNumber: number;
  }[];
  pageCount: number;
}

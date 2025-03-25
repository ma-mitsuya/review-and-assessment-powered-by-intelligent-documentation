# BEACON - ドキュメント分析とチェックリスト作成

## 1. アーキテクチャ概要

BEACON（Building & Engineering Approval Compliance Navigator）は、不動産業界向けのAIドキュメント適合性チェックシステムです。マルチモーダルLLMを活用して、申請書類や契約書が規制やチェックリストに適合しているかを自動的に確認します。

## 2. 処理フロー

```
┌───────────────┐
│ ドキュメント   │
│ アップロード   │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ S3に保存      │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ ファイル形式   │
│ 判定          │
└───────┬───────┘
        │
        ├─────────────────┬─────────────────┬─────────────────┐
        │                 │                 │                 │
        ▼                 ▼                 ▼                 ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ PDF処理       │  │ Word処理      │  │ Excel処理     │  │ 画像処理      │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │                  │
        ▼                  ▼                  ▼                  │
┌───────────────┐  ┌───────────────┐  ┌───────────────┐         │
│ ページ分割    │  │ ページ分割    │  │ シート分割    │         │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘         │
        │                  │                  │                  │
        ▼                  ▼                  ▼                  │
┌───────────────────────────────────────────────────────────────┐
│                   各ページ/シートを処理                        │
└───────────────────────────────┬───────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
      ┌───────────────┐               ┌───────────────┐
      │ テキスト抽出  │               │ ページ画像    │
      │ ライブラリ    │               │ 生成          │
      └───────┬───────┘               └───────┬───────┘
              │                               │
              ▼                               ▼
      ┌───────────────┐               ┌───────────────┐
      │ プレーン      │               │ マルチモーダル │
      │ テキスト      │               │ LLM処理       │
      └───────┬───────┘               └───────┬───────┘
              │                               │
              │                               ▼
              │                       ┌───────────────┐
              │                       │ 構造化        │
              │                       │ Markdown      │
              │                       └───────┬───────┘
              │                               │
              └───────────────┬───────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ 結果の組み合わせ  │
                    │ (Combine)        │
                    └────────┬──────────┘
                             │
                             ▼
                    ┌───────────────────┐
                    │ 構造化ドキュメント │
                    │ 保存              │
                    └───────────────────┘
```

## 3. S3ストレージ構造

```
s3://beacon-documents/
├── raw/                              # 元のドキュメント
│   └── {documentId}/
│       └── original.{pdf|docx|xlsx}
│
├── pages/                            # ページ分割結果
│   └── {documentId}/
│       ├── images/                   # ページ画像
│       │   ├── page-001.png
│       │   ├── page-002.png
│       │   └── ...
│       └── text/                     # テキスト抽出結果
│           ├── page-001.txt
│           ├── page-002.txt
│           └── ...
│
├── llm-results/                      # LLM処理結果
│   └── {documentId}/
│       ├── page-001.md              # ページごとのMarkdown
│       ├── page-002.md
│       └── ...
│
├── combined/                         # 統合結果
│   └── {documentId}/
│       ├── combined.md              # 統合Markdown
│       └── combined.json            # 構造化データ
│
└── checklists/                       # チェックリスト
    ├── raw/                         # 元のチェックリスト
    │   └── {checklistId}.{txt|xlsx}
    └── structured/                  # 構造化チェックリスト
        └── {checklistId}.json
```

## 4. データ構造

### 4.1 ドキュメント処理

```typescript
interface DocumentMetadata {
  documentId: string;
  fileName: string;
  fileType: "pdf" | "word" | "excel" | "image" | "text";
  pageCount?: number;
  extractedAt: Date;
  processingStatus: "pending" | "processing" | "completed" | "error";
}

interface ProcessedPage {
  pageNumber: number;
  rawText: string;           // テキスト抽出結果
  markdownContent: string;   // LLMによるMarkdown変換結果
  imageKey?: string;         // S3内の画像パス
  processingStatus: "pending" | "processing" | "completed" | "error";
  processedAt: Date;
}

interface ProcessedDocument {
  documentId: string;
  metadata: DocumentMetadata;
  pages: ProcessedPage[];
  combinedContent?: {
    rawText: string;        // 全ページのテキスト結合
    markdownContent: string; // 全ページのMarkdown結合
    processedAt: Date;
  };
}
```

## 5. 実装例

### 5.1 ドキュメント処理

```typescript
/**
 * ドキュメントを処理し、結果をS3に保存
 */
export async function processDocument(
  documentId: string,
  fileBuffer: Buffer,
  fileName: string,
  client: BedrockRuntimeClient = createBedrockClient()
): Promise<Result<ProcessedDocument, Error>> {
  try {
    // メタデータを作成
    const metadata: DocumentMetadata = {
      documentId,
      fileName,
      fileType: getFileType(fileName),
      extractedAt: new Date(),
      processingStatus: 'processing'
    };

    // S3に元のファイルを保存
    await s3.putObject({
      Bucket: 'beacon-documents',
      Key: `raw/${documentId}/original${path.extname(fileName)}`,
      Body: fileBuffer
    });

    // ページ分割
    const pages = await splitIntoPages(fileBuffer, metadata.fileType);
    
    // 各ページを並行処理
    const processedPages = await Promise.all(pages.map(async (page, index) => {
      const pageNumber = index + 1;
      
      // ページ画像をS3に保存
      const imageKey = `pages/${documentId}/images/page-${String(pageNumber).padStart(3, '0')}.png`;
      await s3.putObject({
        Bucket: 'beacon-documents',
        Key: imageKey,
        Body: page.imageBuffer,
        ContentType: 'image/png'
      });

      // テキスト抽出
      const rawText = await extractText(page.buffer, metadata.fileType);
      
      // テキストをS3に保存
      await s3.putObject({
        Bucket: 'beacon-documents',
        Key: `pages/${documentId}/text/page-${String(pageNumber).padStart(3, '0')}.txt`,
        Body: rawText
      });

      // マルチモーダルLLM処理
      const llmResult = await processPageWithMultimodalLLM(
        page.imageBuffer,
        pageNumber,
        client
      );

      if (!llmResult.ok) {
        throw llmResult.error;
      }

      // Markdownを保存
      await s3.putObject({
        Bucket: 'beacon-documents',
        Key: `llm-results/${documentId}/page-${String(pageNumber).padStart(3, '0')}.md`,
        Body: llmResult.value
      });

      return {
        pageNumber,
        rawText,
        markdownContent: llmResult.value,
        imageKey,
        processingStatus: 'completed',
        processedAt: new Date()
      } as ProcessedPage;
    }));

    // 結果を統合
    const combinedContent = combineResults(processedPages);
    
    // 統合結果を保存
    await s3.putObject({
      Bucket: 'beacon-documents',
      Key: `combined/${documentId}/combined.md`,
      Body: combinedContent.markdownContent
    });

    const processedDocument: ProcessedDocument = {
      documentId,
      metadata: {
        ...metadata,
        pageCount: processedPages.length,
        processingStatus: 'completed'
      },
      pages: processedPages,
      combinedContent
    };

    // 最終的な処理結果を保存
    await s3.putObject({
      Bucket: 'beacon-documents',
      Key: `combined/${documentId}/combined.json`,
      Body: JSON.stringify(processedDocument)
    });

    return ok(processedDocument);
  } catch (error) {
    // エラー情報を保存
    await s3.putObject({
      Bucket: 'beacon-documents',
      Key: `combined/${documentId}/error.json`,
      Body: JSON.stringify({
        documentId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      })
    });

    return err(error instanceof Error ? error : new Error('Unknown error'));
  }
}

/**
 * 処理結果を組み合わせる
 */
function combineResults(pages: ProcessedPage[]): {
  rawText: string;
  markdownContent: string;
  processedAt: Date;
} {
  // テキストとMarkdownを結合
  const rawText = pages
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map(page => page.rawText)
    .join('\n\n');

  const markdownContent = pages
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map(page => page.markdownContent)
    .join('\n\n');

  return {
    rawText,
    markdownContent,
    processedAt: new Date()
  };
}
```

## 6. エラー処理とリトライ

```typescript
/**
 * 失敗したページの処理を再試行
 */
export async function retryFailedPages(
  documentId: string,
  client: BedrockRuntimeClient = createBedrockClient()
): Promise<Result<ProcessedDocument, Error>> {
  try {
    // 現在の処理状態を取得
    const currentState = await s3.getObject({
      Bucket: 'beacon-documents',
      Key: `combined/${documentId}/combined.json`
    }).promise();

    const processedDocument = JSON.parse(
      currentState.Body!.toString()
    ) as ProcessedDocument;

    // 失敗したページを特定
    const failedPages = processedDocument.pages.filter(
      page => page.processingStatus === 'error'
    );

    // 失敗したページを再処理
    const retriedPages = await Promise.all(
      failedPages.map(async page => {
        // 画像を取得
        const imageBuffer = await s3.getObject({
          Bucket: 'beacon-documents',
          Key: page.imageKey!
        }).promise();

        // 再処理
        const llmResult = await processPageWithMultimodalLLM(
          imageBuffer.Body as Buffer,
          page.pageNumber,
          client
        );

        if (!llmResult.ok) {
          throw llmResult.error;
        }

        // 結果を保存
        await s3.putObject({
          Bucket: 'beacon-documents',
          Key: `llm-results/${documentId}/page-${String(page.pageNumber).padStart(3, '0')}.md`,
          Body: llmResult.value
        });

        return {
          ...page,
          markdownContent: llmResult.value,
          processingStatus: 'completed',
          processedAt: new Date()
        };
      })
    );

    // 処理結果を更新
    const updatedPages = processedDocument.pages.map(page => {
      const retriedPage = retriedPages.find(p => p.pageNumber === page.pageNumber);
      return retriedPage || page;
    });

    // 更新された結果を保存
    const updatedDocument = {
      ...processedDocument,
      pages: updatedPages,
      combinedContent: combineResults(updatedPages)
    };

    await s3.putObject({
      Bucket: 'beacon-documents',
      Key: `combined/${documentId}/combined.json`,
      Body: JSON.stringify(updatedDocument)
    });

    return ok(updatedDocument);
  } catch (error) {
    return err(error instanceof Error ? error : new Error('Unknown error'));
  }
}
```

## 7. 考慮事項

### 7.1 パフォーマンスとコスト

- S3のライフサイクルポリシーを設定し、中間生成物を適切に削除
- 大きなドキュメントの場合は処理を分散化
- 処理済みの結果をキャッシュとして活用

### 7.2 エラー処理

- 各ステップでのエラー情報をS3に保存
- 処理の再開ポイントを明確に記録
- 部分的な失敗からのリカバリを可能に

### 7.3 モニタリング

- 処理状態の可視化
- エラー率の監視
- 処理時間の計測と最適化

### 7.4 セキュリティ

- S3バケットの暗号化
- アクセス制御の適切な設定
- 一時データの確実な削除

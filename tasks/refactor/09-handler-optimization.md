# ハンドラー最適化計画

## 1. エラーハンドリングの改善

### 修正方針

1. try-catchブロックでのエラーハンドリングを統一
2. 新しいエラークラスを使用
3. エラーレスポンスの形式を統一

### 例: ChecklistSetHandlerの最適化

```typescript
/**
 * チェックリストセット作成ハンドラー
 */
export async function createChecklistSetHandler(
  request: FastifyRequest<{ Body: CreateChecklistSetRequest }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { name, description, documents } = request.body;

    const checklistSetService = new ChecklistSetService();
    const result = await checklistSetService.createChecklistSet({
      name,
      description,
      documents: documents || [],
    });

    reply.code(200).send({
      success: true,
      data: {
        checkListSetId: result.id,
        name: result.name,
        description: result.description,
        processingStatus: "pending",
        isEditable: true, // 新規作成時は必ず編集可能
      },
    });
  } catch (error) {
    request.log.error(error);

    // ApplicationErrorの場合は、そのステータスコードとメッセージを使用
    if (error instanceof ApplicationError) {
      reply.code(error.statusCode).send({
        success: false,
        error: error.message,
        code: error.errorCode,
      });
      return;
    }

    // その他のエラーの場合は500エラー
    reply.code(500).send({
      success: false,
      error: "チェックリストセットの作成に失敗しました",
    });
  }
}
```

### 例: ReviewJobHandlerの最適化

```typescript
/**
 * 審査ジョブ作成ハンドラー
 */
export async function createReviewJobHandler(
  request: FastifyRequest<{ Body: CreateReviewJobParams }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { name, documentId, checkListSetId, fileType, filename, s3Key } =
      request.body;

    // ユーザーIDの取得（認証情報から）
    // 注: 認証機能が実装されていない場合はnullになります
    const userId = undefined; // 認証機能が実装されたら request.user?.id などに変更

    const reviewJobService = new ReviewJobService();
    const job = await reviewJobService.createReviewJob({
      name,
      documentId,
      checkListSetId,
      fileType,
      filename,
      s3Key,
      userId,
    });

    // レスポンス形式に変換
    const responseData = {
      reviewJobId: job.id,
      name: job.name,
      status: job.status,
      document: job.document
        ? {
            documentId: job.document.id,
            filename: job.document.filename,
          }
        : undefined,
      check_list_set: job.checkListSet
        ? {
            check_list_set_id: job.checkListSet.id,
            name: job.checkListSet.name,
          }
        : undefined,
      created_at: job.createdAt,
      updated_at: job.updatedAt,
      completed_at: job.completedAt,
    };

    reply.code(201).send({
      success: true,
      data: responseData,
    });
  } catch (error) {
    request.log.error(error);

    // ApplicationErrorの場合は、そのステータスコードとメッセージを使用
    if (error instanceof ApplicationError) {
      reply.code(error.statusCode).send({
        success: false,
        error: error.message,
        code: error.errorCode,
      });
      return;
    }

    // その他のエラーの場合は500エラー
    reply.code(500).send({
      success: false,
      error: "審査ジョブの作成に失敗しました",
    });
  }
}
```

## 2. レスポンス形式の統一

### 修正方針

1. 成功レスポンスの形式を統一
2. エラーレスポンスの形式を統一
3. ステータスコードの使用を統一

### 例: 統一されたレスポンス形式

```typescript
// 成功レスポンス
{
  "success": true,
  "data": {
    // レスポンスデータ
  }
}

// エラーレスポンス
{
  "success": false,
  "error": "エラーメッセージ",
  "code": "エラーコード" // オプション
}
```

## 実装方針

1. 各ハンドラーのエラーハンドリングを新しいエラークラスを使用するように修正
2. レスポンス形式を統一
3. 適切なステータスコードの使用を確認
4. コメントを適切に更新

# エラーハンドリング改善計画

## 概要

現状のエラーハンドリングは、エラーメッセージが直接ハードコードされており、エラーの種類によって条件分岐している状態です。これを改善するために、専用のException classを定義し、統一されたエラーハンドリング方法を導入します。

## 新規作成するファイル

### 1. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/core/errors/application-errors.ts`

```typescript
/**
 * アプリケーションエラー基底クラス
 */
export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly errorCode?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * リソースが見つからないエラー
 */
export class NotFoundError extends ApplicationError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 404, 'NOT_FOUND');
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends ApplicationError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

/**
 * 権限エラー
 */
export class ForbiddenError extends ApplicationError {
  constructor(message: string) {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * 関連リソースが存在するため操作できないエラー
 */
export class LinkedResourceError extends ApplicationError {
  constructor(message: string) {
    super(message, 400, 'LINKED_RESOURCE');
  }
}

/**
 * チェックリスト関連のエラー
 */
export class ChecklistError extends ApplicationError {
  constructor(message: string, errorCode: string) {
    super(message, 400, errorCode);
  }
}

/**
 * 審査関連のエラー
 */
export class ReviewError extends ApplicationError {
  constructor(message: string, errorCode: string) {
    super(message, 400, errorCode);
  }
}

/**
 * ドキュメント関連のエラー
 */
export class DocumentError extends ApplicationError {
  constructor(message: string, errorCode: string) {
    super(message, 400, errorCode);
  }
}
```

### 2. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/core/errors/error-handler.ts`

```typescript
/**
 * エラーハンドラーミドルウェア
 */
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ApplicationError } from './application-errors';

/**
 * エラーレスポンスの型
 */
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

/**
 * エラーハンドラーミドルウェア
 * @param error エラーオブジェクト
 * @param request リクエストオブジェクト
 * @param reply レスポンスオブジェクト
 */
export function errorHandler(
  error: Error | ApplicationError | FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  // エラーをログに記録
  request.log.error(error);

  // ApplicationErrorの場合
  if (error instanceof ApplicationError) {
    const response: ErrorResponse = {
      success: false,
      error: error.message,
    };

    // エラーコードがある場合は追加
    if (error.errorCode) {
      response.code = error.errorCode;
    }

    reply.code(error.statusCode).send(response);
    return;
  }

  // FastifyErrorの場合
  if ((error as FastifyError).statusCode) {
    const fastifyError = error as FastifyError;
    reply.code(fastifyError.statusCode).send({
      success: false,
      error: fastifyError.message,
    });
    return;
  }

  // その他のエラーの場合は500エラー
  reply.code(500).send({
    success: false,
    error: 'Internal Server Error',
  });
}
```

### 3. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/core/errors/index.ts`

```typescript
export * from './application-errors';
export * from './error-handler';
```

## 修正するファイル

### 1. `/Users/tksuzuki/projects/real-estate/aws-summit/beacon/backend/src/api/index.ts`

エラーハンドラーを登録するコードを追加します。

```typescript
import { errorHandler } from './core/errors';

// ...既存のコード...

// エラーハンドラーを登録
app.setErrorHandler(errorHandler);
```

## 実装方針

1. 共通のエラークラス階層を作成
2. 各機能固有のエラークラスを作成
3. エラーハンドラーミドルウェアを実装
4. 各サービスとハンドラーでエラークラスを使用するように修正

## 期待される効果

1. エラーハンドリングの一貫性向上
2. エラーメッセージとステータスコードの集中管理
3. エラー種別による条件分岐の簡素化
4. クライアントへのエラーレスポンスの統一

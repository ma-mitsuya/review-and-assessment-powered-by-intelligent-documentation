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
    super(`${resource} not found: ${id}`, 404, "NOT_FOUND");
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends ApplicationError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

/**
 * 権限エラー
 */
export class ForbiddenError extends ApplicationError {
  constructor(message: string) {
    super(message, 403, "FORBIDDEN");
  }
}

/**
 * 関連リソースが存在するため操作できないエラー
 */
export class LinkedResourceError extends ApplicationError {
  constructor(message: string) {
    super(message, 400, "LINKED_RESOURCE");
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

/**
 * 成功または失敗を表す結果型
 */
export type Result<T, E> = Success<T> | Failure<E>;

/**
 * 成功結果
 */
export interface Success<T> {
  ok: true;
  value: T;
}

/**
 * 失敗結果
 */
export interface Failure<E> {
  ok: false;
  error: E;
}

/**
 * 成功結果を作成
 */
export function ok<T>(value: T): Success<T> {
  return { ok: true, value };
}

/**
 * 失敗結果を作成
 */
export function err<E>(error: E): Failure<E> {
  return { ok: false, error };
}

/**
 * 結果をマップする
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.ok) {
    return ok(fn(result.value));
  } else {
    return result;
  }
}

/**
 * 結果をフラットマップする
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.ok) {
    return fn(result.value);
  } else {
    return result;
  }
}

export async function flatMapAsync<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Promise<Result<U, E>>
): Promise<Result<U, E>> {
  if (result.ok) {
    return await fn(result.value);
  } else {
    return result;
  }
}

/**
 * 結果からエラーをマップする
 */
export function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (result.ok) {
    return result;
  } else {
    return err(fn(result.error));
  }
}

/**
 * 結果を解析する
 */
export function match<T, E, U>(
  result: Result<T, E>,
  onSuccess: (value: T) => U,
  onFailure: (error: E) => U
): U {
  if (result.ok) {
    return onSuccess(result.value);
  } else {
    return onFailure(result.error);
  }
}

/**
 * 結果が成功の場合に副作用を実行
 */
export function tap<T, E>(
  result: Result<T, E>,
  fn: (value: T) => void
): Result<T, E> {
  if (result.ok) {
    fn(result.value);
  }
  return result;
}

/**
 * 結果が失敗の場合に副作用を実行
 */
export function tapError<T, E>(
  result: Result<T, E>,
  fn: (error: E) => void
): Result<T, E> {
  if (!result.ok) {
    fn(result.error);
  }
  return result;
}

export async function allResults<T, E>(
  results: Promise<Result<T, E>>[]
): Promise<Result<T[], E>> {
  const resolved = await Promise.all(results);
  const failed = resolved.find((r) => !r.ok);
  if (failed && !failed.ok) return err(failed.error);
  return ok(resolved.map((r) => (r as Success<T>).value));
}

/**
 * 結果をアンラップし、成功の場合は値を返す。失敗の場合は例外をスローする
 */
export function unwrapOrThrow<T, E extends Error>(result: Result<T, E>): T {
  if (result.ok) return result.value;
  throw result.error;
}

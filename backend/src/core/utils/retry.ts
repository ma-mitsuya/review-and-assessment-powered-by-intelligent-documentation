// /**
//  * リトライオプション
//  */
// export interface RetryOptions {
//   maxRetries: number;
//   initialDelayMs: number;
//   maxDelayMs: number;
//   backoffFactor: number;
//   shouldRetry: (error: any) => boolean;
// }

// /**
//  * デフォルトのリトライオプション
//  */
// export const defaultRetryOptions: RetryOptions = {
//   maxRetries: 3,
//   initialDelayMs: 1000,
//   maxDelayMs: 10000,
//   backoffFactor: 2,
//   shouldRetry: (error) => !!error
// };

// /**
//  * 指定された時間だけ待機する
//  */
// export function sleep(ms: number): Promise<void> {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

// /**
//  * 指数バックオフを使用して関数を実行する
//  *
//  * @param fn 実行する関数
//  * @param options リトライオプション
//  * @returns 関数の実行結果
//  */
// export async function exponentialBackoff<T>(
//   fn: () => Promise<T>,
//   options: Partial<RetryOptions> = {}
// ): Promise<T> {
//   const opts: RetryOptions = {
//     ...defaultRetryOptions,
//     ...options
//   };

//   let lastError: any;
//   let delay = opts.initialDelayMs;

//   for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       lastError = error;

//       if (attempt >= opts.maxRetries || !opts.shouldRetry(error)) {
//         break;
//       }

//       console.warn(`リトライ ${attempt + 1}/${opts.maxRetries} (${delay}ms後): ${error instanceof Error ? error.message : String(error)}`);

//       await sleep(delay);

//       // 次の遅延を計算（指数バックオフ）
//       delay = Math.min(delay * opts.backoffFactor, opts.maxDelayMs);
//     }
//   }

//   throw lastError;
// }

// /**
//  * 関数をリトライ可能にラップする
//  *
//  * @param fn ラップする関数
//  * @param options リトライオプション
//  * @returns ラップされた関数
//  */
// export function withRetry<T extends (...args: any[]) => Promise<any>>(
//   fn: T,
//   options: Partial<RetryOptions> = {}
// ): T {
//   return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
//     return exponentialBackoff(
//       () => fn(...args),
//       options
//     );
//   }) as T;
// }

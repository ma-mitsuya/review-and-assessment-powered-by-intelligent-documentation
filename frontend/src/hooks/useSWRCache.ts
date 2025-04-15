import { cache } from 'swr';

/**
 * SWRのキャッシュを操作するためのユーティリティ関数
 */
export const SWRCache = {
  /**
   * 特定のキーのキャッシュを無効化する
   * @param key キャッシュキー
   */
  invalidate: (key: string) => {
    cache.delete(key);
  },

  /**
   * 特定のパターンに一致するすべてのキャッシュを無効化する
   * @param pattern 正規表現パターン
   */
  invalidatePattern: (pattern: RegExp) => {
    const keys = cache.keys();
    for (const key of keys) {
      if (pattern.test(key)) {
        cache.delete(key);
      }
    }
  },

  /**
   * すべてのキャッシュを無効化する
   */
  invalidateAll: () => {
    const keys = cache.keys();
    for (const key of keys) {
      cache.delete(key);
    }
  }
};

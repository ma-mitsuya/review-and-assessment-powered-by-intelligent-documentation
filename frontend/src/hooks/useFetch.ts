/**
 * SWRを使用したデータフェッチカスタムフック
 */
import useSWR from 'swr';
import { ApiResponse } from '../types/api';

// APIのベースURL
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * APIからデータをフェッチするためのfetcher関数
 */
const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${url}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'APIリクエストに失敗しました');
  }
  
  return response.json();
};

/**
 * GETリクエストを行うカスタムフック
 * @param path APIエンドポイントのパス
 * @param options SWRのオプション
 */
export function useFetch<T>(path: string, options = {}) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<T>>(
    path,
    fetcher,
    {
      revalidateOnFocus: false,
      ...options,
    }
  );

  return {
    data: data?.data,
    meta: data?.meta,
    error,
    isLoading,
    mutate,
  };
}

/**
 * POSTリクエストを行う関数
 * @param path APIエンドポイントのパス
 * @param body リクエストボディ
 */
export async function postData<T, R = any>(path: string, body: T): Promise<ApiResponse<R>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return response.json();
}

/**
 * PUTリクエストを行う関数
 * @param path APIエンドポイントのパス
 * @param body リクエストボディ
 */
export async function putData<T, R = any>(path: string, body: T): Promise<ApiResponse<R>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return response.json();
}

/**
 * DELETEリクエストを行う関数
 * @param path APIエンドポイントのパス
 */
export async function deleteData<R = any>(path: string): Promise<ApiResponse<R>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
  });

  return response.json();
}

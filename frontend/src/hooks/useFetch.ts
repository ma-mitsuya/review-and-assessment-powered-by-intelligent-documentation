import { useState } from 'react';
import { ApiResponse } from '../types/api';

// API のベース URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * SWR で使用する fetcher 関数
 */
export const fetcher = async (url: string) => {
  const response = await fetch(`${API_BASE_URL}${url}`);
  if (!response.ok) {
    throw new Error('API request failed');
  }
  return response.json();
};

/**
 * POST リクエストを送信する関数
 */
export const postData = async <T>(url: string, data: any): Promise<ApiResponse<T>> => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  return response.json();
};

/**
 * PUT リクエストを送信する関数
 */
export const putData = async <T>(url: string, data: any): Promise<ApiResponse<T>> => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  return response.json();
};

/**
 * DELETE リクエストを送信する関数
 */
export const deleteData = async <T>(url: string): Promise<ApiResponse<T>> => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'DELETE',
  });
  
  return response.json();
};

/**
 * データ送信用のカスタムフック
 */
export function useSubmit<T, R = any>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ApiResponse<R> | null>(null);
  
  const submit = async (url: string, method: 'POST' | 'PUT' | 'DELETE', submitData?: T) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (method === 'POST') {
        response = await postData<R>(url, submitData);
      } else if (method === 'PUT') {
        response = await putData<R>(url, submitData);
      } else {
        response = await deleteData<R>(url);
      }
      
      setData(response);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { submit, isLoading, error, data };
}

/**
 * チェックリスト作成機能のカスタムフック
 */

import { useState } from "react";
import { mutate } from "swr";
import useHttp from "../../../hooks/useHttp";
import { DocumentUploadResult } from "../../../hooks/useDocumentUpload";
import { getCheckListSetsKey } from "./useCheckListSets";
import { ApiResponse } from "../types";

/**
 * チェックリスト作成リクエスト
 */
export interface CreateChecklistRequest {
  name: string;
  description?: string;
  documents: DocumentUploadResult[];
}

/**
 * チェックリスト作成フックの戻り値
 */
interface UseChecklistCreationReturn {
  createChecklist: (data: CreateChecklistRequest) => Promise<ApiResponse<any>>;
  isCreating: boolean;
  error: Error | null;
}

/**
 * チェックリスト作成機能のカスタムフック
 */
export function useChecklistCreation(): UseChecklistCreationReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const http = useHttp();

  /**
   * チェックリストを作成する
   * アップロード済みのドキュメント情報を使用
   */
  const createChecklist = async (
    data: CreateChecklistRequest
  ): Promise<any> => {
    setIsCreating(true);
    setError(null);

    try {
      // チェックリストセットを作成
      const response = await http.post<ApiResponse<any>>("/checklist-sets", {
        name: data.name,
        description: data.description,
        documents: data.documents.map((doc) => ({
          documentId: doc.documentId,
          filename: doc.filename,
          s3Key: doc.s3Key,
          fileType: doc.fileType,
        })),
      });

      if (!response.data.success) {
        throw new Error(
          response.data.error || "チェックリストセットの作成に失敗しました"
        );
      }

      // キャッシュを無効化
      mutate(getCheckListSetsKey());

      return response.data.data;
    } catch (error) {
      const err =
        error instanceof Error
          ? error
          : new Error("チェックリストの作成に失敗しました");
      setError(err);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createChecklist,
    isCreating,
    error,
  };
}

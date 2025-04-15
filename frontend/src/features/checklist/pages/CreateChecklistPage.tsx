/**
 * チェックリスト作成ページ
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/PageHeader";
import FormTextField from "../../../components/FormTextField";
import FormTextArea from "../../../components/FormTextArea";
import FormFileUpload from "../../../components/FormFileUpload";
import Button from "../../../components/Button";
import { useChecklistCreation } from "../hooks/useChecklistCreation";
import {
  useDocumentUpload,
  DocumentUploadResult,
} from "../hooks/useDocumentUpload";
import { ProcessingStatus } from "../components/ProcessingStatus";

/**
 * チェックリスト作成ページ
 */
export function CreateChecklistPage() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    files: "",
  });

  const {
    createChecklist,
    isCreating,
    error: createError,
  } = useChecklistCreation();
  const {
    uploadDocument,
    uploadedDocuments,
    clearUploadedDocuments,
    removeDocument,
    deleteDocument,
    isUploading,
    error: uploadError,
  } = useDocumentUpload();

  // 入力値の変更ハンドラ
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 入力時にエラーをクリア
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // ファイル変更ハンドラ
  const handleFilesChange = async (newFiles: File[]) => {
    setSelectedFiles(newFiles);

    // 新しく追加されたファイルのみをアップロード
    const existingFilenames = uploadedDocuments.map((doc) => doc.filename);
    const filesToUpload = newFiles.filter(
      (file) => !existingFilenames.includes(file.name)
    );

    if (filesToUpload.length === 0) return;

    try {
      // 各ファイルを個別にアップロード
      for (const file of filesToUpload) {
        await uploadDocument(file);
      }

      // ファイル選択時にエラーをクリア
      if (errors.files) {
        setErrors((prev) => ({
          ...prev,
          files: "",
        }));
      }
    } catch (error) {
      console.error("ファイルアップロードエラー:", error);
    }
  };

  // ファイル削除ハンドラ
  const handleFileRemove = async (index: number) => {
    const fileToRemove = selectedFiles[index];

    // 選択済みファイルリストから削除
    const newSelectedFiles = [...selectedFiles];
    newSelectedFiles.splice(index, 1);
    setSelectedFiles(newSelectedFiles);

    // アップロード済みドキュメントリストからも削除
    const docToRemove = uploadedDocuments.find(
      (doc) => doc.filename === fileToRemove.name
    );
    if (docToRemove) {
      // S3からも削除
      await deleteDocument(docToRemove.documentId);
    }

    // ファイルがなくなった場合はエラーを表示
    if (newSelectedFiles.length === 0) {
      setErrors((prev) => ({
        ...prev,
        files: "少なくとも1つのファイルを選択してください",
      }));
    }
  };

  // バリデーション
  const validate = () => {
    const newErrors = {
      name: "",
      files: "",
    };

    if (!formData.name.trim()) {
      newErrors.name = "名前は必須です";
    }

    if (uploadedDocuments.length === 0) {
      newErrors.files = "少なくとも1つのファイルをアップロードしてください";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  // フォーム送信ハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const result = await createChecklist({
        name: formData.name,
        description: formData.description,
        documents: uploadedDocuments,
      });

      // アップロード済みドキュメントリストをクリア
      clearUploadedDocuments();

      // 作成成功後、一覧ページに遷移
      navigate("/checklist", { replace: true });
    } catch (error) {
      console.error("チェックリスト作成エラー:", error);
    }
  };

  // 表示するエラー
  const displayError = uploadError || createError;

  return (
    <div>
      <PageHeader
        title="チェックリストセットの新規作成"
        description="新しいチェックリストセットを作成し、関連ファイルをアップロードします"
        backLink={{
          to: "/checklist",
          label: "チェックリスト一覧に戻る",
        }}
      />

      {displayError && (
        <div
          className="bg-light-red border border-red text-red px-6 py-4 rounded-md shadow-sm mb-6"
          role="alert"
        >
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <strong className="font-medium">エラー: </strong>
            <span className="ml-2">{displayError.message}</span>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 border border-light-gray">
        <form onSubmit={handleSubmit}>
          <FormTextField
            id="name"
            name="name"
            label="名前"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="チェックリストセットの名前"
            required
            error={errors.name}
          />

          <FormTextArea
            id="description"
            name="description"
            label="説明"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="チェックリストセットの説明"
          />

          <FormFileUpload
            label="ファイル"
            files={selectedFiles}
            onFilesChange={handleFilesChange}
            required
            error={errors.files}
            isUploading={isUploading}
            uploadedDocuments={uploadedDocuments}
            onDeleteFile={handleFileRemove}
          />

          <div className="flex justify-end space-x-3">
            <Button variant="outline" to="/checklist">
              キャンセル
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={
                isCreating || isUploading || uploadedDocuments.length === 0
              }
            >
              {(isCreating || isUploading) && (
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              作成
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

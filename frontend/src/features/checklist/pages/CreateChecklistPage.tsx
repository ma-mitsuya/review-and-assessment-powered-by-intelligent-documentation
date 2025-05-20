/**
 * チェックリスト作成ページ
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/PageHeader";
import FormTextField from "../../../components/FormTextField";
import FormTextArea from "../../../components/FormTextArea";
import FormFileUpload from "../../../components/FormFileUpload";
import Button from "../../../components/Button";
import { useCreateChecklistSet } from "../hooks/useCheckListSetMutations";
import { useDocumentUpload } from "../../../hooks/useDocumentUpload";
import { HiExclamationCircle } from "react-icons/hi";
import { useToast } from "../../../contexts/ToastContext";

/**
 * チェックリスト作成ページ
 */
export function CreateChecklistPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
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
    createChecklistSet,
    status,
    error: createError,
  } = useCreateChecklistSet();
  const isCreating = status === "loading";
  const {
    uploadDocument,
    uploadedDocuments,
    clearUploadedDocuments,
    deleteDocument,
    isUploading,
    error: uploadError,
  } = useDocumentUpload({
    presignedUrlEndpoint: "/documents/checklist/presigned-url",
    deleteEndpointPrefix: "/documents/checklist/",
  });

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
    const existingFilenames = uploadedDocuments?.map((doc) => doc.filename) || [];
    const filesToUpload = newFiles.filter(
      (file) => !existingFilenames.includes(file.name)
    );

    if (filesToUpload.length === 0) return;

    try {
      // 現状、単一ファイルのみサポート
      const file = filesToUpload[0];
      await uploadDocument(file);

      // ファイル選択時にエラーをクリア
      if (errors.files) {
        setErrors((prev) => ({
          ...prev,
          files: "",
        }));
      }
    } catch (error) {
      console.error("ファイルアップロードエラー:", error);
      addToast("ファイルのアップロードに失敗しました", "error");
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
    const docToRemove = uploadedDocuments?.find(
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

    if (!uploadedDocuments || uploadedDocuments.length === 0) {
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
      await createChecklistSet({
        name: formData.name,
        description: formData.description,
        documents: uploadedDocuments || [],
      });

      // アップロード済みドキュメントリストをクリア
      clearUploadedDocuments();
      
      // 成功メッセージを表示
      addToast("チェックリストセットを作成しました", "success");

      // 作成成功後、一覧ページに遷移
      navigate("/checklist", { replace: true });
    } catch (error) {
      console.error("チェックリスト作成エラー:", error);
      addToast("チェックリストセットの作成に失敗しました", "error");
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
            <HiExclamationCircle className="h-6 w-6 mr-2" />
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
            multiple={false}
            uploadedDocuments={uploadedDocuments || []}
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
                isCreating || 
                isUploading || 
                !uploadedDocuments || 
                uploadedDocuments.length === 0
              }
            >
              {(isCreating || isUploading) && (
                <div className="animate-spin -ml-1 mr-2 h-4 w-4 text-white">
                  <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white"></div>
                </div>
              )}
              作成
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

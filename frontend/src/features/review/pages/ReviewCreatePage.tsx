import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/Button";
import PageHeader from "../../../components/PageHeader";
import FormTextField from "../../../components/FormTextField";
import FormFileUpload from "../../../components/FormFileUpload";
import ChecklistSelector from "../components/ChecklistSelector";
import ComparisonIndicator from "../components/ComparisonIndicator";
import { useReviewCreation } from "../hooks/useReviewCreation";
import { useDocumentUpload } from "../../../hooks/useDocumentUpload";
import { useCheckListSets } from "../../checklist/hooks/useCheckListSets";
import { CheckListSet } from "../../checklist/types";
import { HiExclamationCircle } from "react-icons/hi";

export const ReviewCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<CheckListSet | null>(
    null
  );
  const [jobName, setJobName] = useState("");
  const [errors, setErrors] = useState({
    name: "",
    files: "",
  });

  // チェックリストセット一覧を取得
  const { 
    checkListSets, 
    isLoading: isLoadingCheckListSets, 
    isError: checkListSetsError 
  } = useCheckListSets();

  // 審査ジョブ作成フック
  const {
    createReviewJob,
    isCreating,
    error: createError,
  } = useReviewCreation();

  // ドキュメントアップロードフック
  const {
    uploadDocument,
    uploadedDocuments,
    clearUploadedDocuments,
    removeDocument,
    deleteDocument,
    isUploading,
    error: uploadError,
  } = useDocumentUpload({
    presignedUrlEndpoint: '/documents/review/presigned-url',
    deleteEndpointPrefix: '/documents/review/'
  });

  // ファイルが選択されチェックリストも選択されているかチェック
  const isReady =
    uploadedDocuments?.length > 0 && selectedChecklist !== null && jobName.trim() !== "";

  // 入力値の変更ハンドラ
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "jobName") {
      setJobName(value);
    }

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
      // 各ファイルを個別にアップロード (審査では1ファイルのみ)
      const file = filesToUpload[0];
      const uploadResult = await uploadDocument(file);

      // ファイル名をジョブ名の初期値として設定（ファイルが1つの場合）
      if (newFiles.length === 1 && !jobName) {
        // 拡張子を除いたファイル名を設定
        const fileName = file.name;
        const nameWithoutExtension =
          fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
        setJobName(`${nameWithoutExtension}の審査`);
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

  // チェックリスト選択ハンドラ
  const handleChecklistSelect = (checklist: CheckListSet) => {
    setSelectedChecklist(checklist);
  };

  // バリデーション
  const validate = () => {
    const newErrors = {
      name: "",
      files: "",
    };

    if (!jobName.trim()) {
      newErrors.name = "ジョブ名は必須です";
    }

    if (!uploadedDocuments?.length) {
      newErrors.files = "少なくとも1つのファイルを選択してください";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  // フォーム送信ハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !selectedChecklist) return;

    try {
      // 審査ジョブを作成
      const result = await createReviewJob({
        name: jobName,
        document: uploadedDocuments?.[0], // 審査では1ファイルのみ
        checkListSetId: selectedChecklist.check_list_set_id,
      });

      // アップロード済みドキュメントリストをクリア
      clearUploadedDocuments();

      // 作成成功後、一覧ページに遷移
      navigate("/review", { replace: true });
    } catch (error) {
      console.error("審査ジョブ作成エラー:", error);
    }
  };

  // 表示するエラー
  const displayError = uploadError || createError;

  return (
    <div>
      <PageHeader
        title="新規審査ジョブ作成"
        description="新しい審査ジョブを作成し、ドキュメントとチェックリストを比較します"
        backLink={{
          to: "/review",
          label: "審査ジョブ一覧に戻る",
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
            id="jobName"
            name="jobName"
            label="ジョブ名"
            value={jobName}
            onChange={handleInputChange}
            placeholder="審査ジョブの名前を入力"
            required
            error={errors.name}
          />

          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            {/* 左側: ファイルアップロード */}
            <div className="lg:col-span-3">
              <FormFileUpload
                label="審査対象ファイル"
                files={selectedFiles}
                onFilesChange={handleFilesChange}
                required
                error={errors.files}
                isUploading={isUploading}
                multiple={false}
                uploadedDocuments={uploadedDocuments}
                onDeleteFile={handleFileRemove}
              />
            </div>

            {/* 中央: 比較アイコン */}
            <div className="lg:col-span-1 flex justify-center items-center py-4">
              <ComparisonIndicator isReady={isReady} />
            </div>

            {/* 右側: チェックリスト選択 */}
            <div className="lg:col-span-3">
              {isLoadingCheckListSets ? (
                <div className="flex items-center justify-center h-full p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : checkListSetsError ? (
                <div className="text-red p-4 border border-red rounded-md">
                  チェックリストの読み込みに失敗しました
                </div>
              ) : (
                <ChecklistSelector
                  checklists={checkListSets || []}
                  selectedChecklistId={selectedChecklist?.check_list_set_id || null}
                  onSelectChecklist={handleChecklistSelect}
                />
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <Button variant="outline" to="/review">
              キャンセル
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!isReady || isCreating || isUploading}
            >
              {(isCreating || isUploading) ? (
                <>
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 text-white">
                    <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white"></div>
                  </div>
                  処理中...
                </>
              ) : (
                "比較実施"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewCreatePage;

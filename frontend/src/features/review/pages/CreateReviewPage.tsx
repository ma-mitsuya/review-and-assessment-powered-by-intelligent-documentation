import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/Button";
import PageHeader from "../../../components/PageHeader";
import FormTextField from "../../../components/FormTextField";
import FormFileUpload from "../../../components/FormFileUpload";
import ChecklistSelector from "../components/ChecklistSelector";
import ComparisonIndicator from "../components/ComparisonIndicator";
import { useCreateReviewJob } from "../hooks/useReviewJobMutations";
import { useDocumentUpload } from "../../../hooks/useDocumentUpload";
import { useChecklistSets } from "../../checklist/hooks/useCheckListSetQueries";
import { CheckListSet } from "../../checklist/types";
import { HiExclamationCircle, HiDocumentText, HiPhotograph } from "react-icons/hi";
import SegmentedControl from "../../../components/SegmentedControl";
import { REVIEW_FILE_TYPE } from "../types";

export const CreateReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedChecklist, setSelectedChecklist] =
    useState<CheckListSet | null>(null);
  const [jobName, setJobName] = useState("");
  const [fileType, setFileType] = useState<REVIEW_FILE_TYPE>(REVIEW_FILE_TYPE.PDF);
  const [errors, setErrors] = useState({
    name: "",
    files: "",
  });

  // チェックリストセット一覧を取得
  const {
    items: checkListSets,
    isLoading: isLoadingCheckListSets,
    error: checkListSetsError,
  } = useChecklistSets();

  // 審査ジョブ作成フック
  const { createReviewJob, status, error: createError } = useCreateReviewJob();
  const isSubmitting = status === "loading";

  // ドキュメントアップロードフック
  const {
    uploadDocument,
    uploadDocuments,
    clearUploadedDocuments,
    deleteDocument,
    isUploading,
    error: uploadError,
    uploadedDocuments,
  } = useDocumentUpload({
    presignedUrlEndpoint: "/documents/review/presigned-url",
    imagesPresignedUrlEndpoint: "/documents/review/images/presigned-url",
    deleteEndpointPrefix: "/documents/review/",
  });

  // ファイルが選択されチェックリストも選択されているかチェック
  const isReady =
    uploadedDocuments?.length > 0 &&
    selectedChecklist !== null &&
    jobName.trim() !== "";

  // ファイルタイプ選択ハンドラ
  const handleFileTypeChange = (value: string) => {
    setFileType(value as REVIEW_FILE_TYPE);
    // ファイルタイプが変更されたら選択済みファイルをクリア
    setSelectedFiles([]);
    clearUploadedDocuments();
  };

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
    // ファイルタイプに基づいて検証
    if (fileType === REVIEW_FILE_TYPE.PDF && newFiles.length > 1) {
      setErrors(prev => ({
        ...prev,
        files: "PDF モードでは1つのファイルのみアップロードできます"
      }));
      return;
    }
    
    if (fileType === REVIEW_FILE_TYPE.IMAGE && newFiles.length > 20) {
      setErrors(prev => ({
        ...prev,
        files: "画像モードでは最大20枚までアップロードできます"
      }));
      return;
    }

    setSelectedFiles(newFiles);

    // 新しく追加されたファイルのみをアップロード
    const existingFilenames =
      uploadedDocuments?.map((doc) => doc.filename) || [];
    const filesToUpload = newFiles.filter(
      (file) => !existingFilenames.includes(file.name)
    );

    if (filesToUpload.length === 0) return;

    try {
      if (fileType === REVIEW_FILE_TYPE.PDF) {
        // PDFファイルの場合は1つだけアップロード
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
      } else {
        // 画像ファイルの場合は複数アップロード
        const uploadResults = await uploadDocuments(filesToUpload);
        
        // ファイル名をジョブ名の初期値として設定（ファイルが1つの場合）
        if (newFiles.length === 1 && !jobName) {
          const fileName = newFiles[0].name;
          const nameWithoutExtension =
            fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
          setJobName(`${nameWithoutExtension}の審査`);
        }
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
      if (fileType === REVIEW_FILE_TYPE.PDF) {
        const doc = uploadedDocuments[0];
        // PDF審査ジョブを作成
        await createReviewJob({
          name: jobName,
          documentId: doc.documentId,
          checkListSetId: selectedChecklist.id,
          filename: doc.filename,
          s3Key: doc.s3Key,
          fileType: REVIEW_FILE_TYPE.PDF,
        });
      } else {
        // 画像審査ジョブを作成
        const firstDoc = uploadedDocuments[0];
        await createReviewJob({
          name: jobName,
          documentId: firstDoc.documentId,
          checkListSetId: selectedChecklist.id,
          filename: firstDoc.filename,
          s3Key: firstDoc.s3Key,
          fileType: REVIEW_FILE_TYPE.IMAGE,
          imageFiles: uploadedDocuments.map(doc => ({
            filename: doc.filename,
            s3Key: doc.s3Key
          }))
        });
      }

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

          <div className="mb-6">
            <label className="block text-aws-squid-ink-light dark:text-aws-font-color-white-dark font-medium mb-2">
              ファイルタイプ <span className="text-red">*</span>
            </label>
            <SegmentedControl
              name="fileType"
              options={[
                {
                  value: REVIEW_FILE_TYPE.PDF,
                  label: "PDF ファイル (1ファイル)",
                  icon: <HiDocumentText />
                },
                {
                  value: REVIEW_FILE_TYPE.IMAGE,
                  label: "画像ファイル (最大20枚)",
                  icon: <HiPhotograph />
                }
              ]}
              value={fileType}
              onChange={handleFileTypeChange}
            />
          </div>

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
                multiple={fileType === REVIEW_FILE_TYPE.IMAGE}
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
                  selectedChecklistId={selectedChecklist?.id || null}
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
              disabled={!isReady || isSubmitting || isUploading}
            >
              {isSubmitting || isUploading ? (
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

export default CreateReviewPage;

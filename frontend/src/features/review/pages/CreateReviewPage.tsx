import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import {
  HiExclamationCircle,
  HiDocumentText,
  HiPhotograph,
} from "react-icons/hi";
import SegmentedControl from "../../../components/SegmentedControl";
import { REVIEW_FILE_TYPE } from "../types";

export const CreateReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedChecklist, setSelectedChecklist] =
    useState<CheckListSet | null>(null);
  const [jobName, setJobName] = useState("");
  const [fileType, setFileType] = useState<REVIEW_FILE_TYPE>(
    REVIEW_FILE_TYPE.PDF
  );
  const [errors, setErrors] = useState({
    name: "",
    files: "",
  });

  // チェックリストセット一覧を取得（completedステータスのみ）
  const {
    items: checkListSets,
    isLoading: isLoadingCheckListSets,
    error: checkListSetsError,
  } = useChecklistSets(undefined, undefined, "completed");

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
      setErrors((prev) => ({
        ...prev,
        files: t('review.pdfLimitError'),
      }));
      return;
    }

    if (fileType === REVIEW_FILE_TYPE.IMAGE && newFiles.length > 20) {
      setErrors((prev) => ({
        ...prev,
        files: t('review.imageLimitError'),
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
          setJobName(`${nameWithoutExtension}${t('review.jobNameSuffix')}`);
        }
      } else {
        // 画像ファイルの場合は複数アップロード
        const uploadResults = await uploadDocuments(filesToUpload);

        // ファイル名をジョブ名の初期値として設定（ファイルが1つの場合）
        if (newFiles.length === 1 && !jobName) {
          const fileName = newFiles[0].name;
          const nameWithoutExtension =
            fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
          setJobName(`${nameWithoutExtension}${t('review.jobNameSuffix')}`);
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
      console.error(t('review.fileUploadError'), error);
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
        files: t('review.fileRequired'),
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
      newErrors.name = t('review.nameRequired');
    }

    if (!uploadedDocuments?.length) {
      newErrors.files = t('review.fileRequired');
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  // フォーム送信ハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !selectedChecklist) return;

    try {
      // すべてのドキュメントを同じ構造で扱う
      const documents = uploadedDocuments.map(doc => ({
        id: doc.documentId,
        filename: doc.filename,
        s3Key: doc.s3Key,
        fileType: fileType,
      }));

      // 審査ジョブを作成
      await createReviewJob({
        name: jobName,
        checkListSetId: selectedChecklist.id,
        documents: documents,
      });

      // アップロード済みドキュメントリストをクリア
      clearUploadedDocuments();

      // 作成成功後、一覧ページに遷移
      navigate("/review", { replace: true });
    } catch (error) {
      console.error(t('review.createError'), error);
    }
  };

  // 表示するエラー
  const displayError = uploadError || createError;

  return (
    <div>
      <PageHeader
        title={t('review.createTitle')}
        description={t('review.createDescription')}
        backLink={{
          to: "/review",
          label: t('review.backToList'),
        }}
      />

      {displayError && (
        <div
          className="bg-light-red border border-red text-red px-6 py-4 rounded-md shadow-sm mb-6"
          role="alert"
        >
          <div className="flex items-center">
            <HiExclamationCircle className="h-6 w-6 mr-2" />
            <strong className="font-medium">{t('common.error')}: </strong>
            <span className="ml-2">{displayError.message}</span>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 border border-light-gray">
        <form onSubmit={handleSubmit}>
          <FormTextField
            id="jobName"
            name="jobName"
            label={t('review.jobName')}
            value={jobName}
            onChange={handleInputChange}
            placeholder={t('review.jobNamePlaceholder')}
            required
            error={errors.name}
          />

          <div className="mb-6">
            <label className="block text-aws-squid-ink-light dark:text-aws-font-color-white-dark font-medium mb-2">
              {t('review.fileType')} <span className="text-red">*</span>
            </label>
            <SegmentedControl
              name="fileType"
              options={[
                {
                  value: REVIEW_FILE_TYPE.PDF,
                  label: t('review.pdfFile'),
                  icon: <HiDocumentText />,
                },
                {
                  value: REVIEW_FILE_TYPE.IMAGE,
                  label: t('review.imageFiles'),
                  icon: <HiPhotograph />,
                },
              ]}
              value={fileType}
              onChange={handleFileTypeChange}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            {/* 左側: ファイルアップロード */}
            <div className="lg:col-span-3">
              <FormFileUpload
                label={t('review.targetFiles')}
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
                  {t('checklist.loadError')}
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
              {t('common.cancel')}
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
                  {t('common.processing')}
                </>
              ) : (
                t('review.compare')
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReviewPage;

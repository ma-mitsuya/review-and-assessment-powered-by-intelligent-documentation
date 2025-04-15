import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/Button';
import PageHeader from '../../../components/PageHeader';
import FormTextField from '../../../components/FormTextField';
import FormFileUpload from '../../../components/FormFileUpload';
import ChecklistSelector from '../components/ChecklistSelector';
import ComparisonIndicator from '../components/ComparisonIndicator';
import { mockChecklists } from '../mockData';
import { Checklist } from '../types';

export const ReviewCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [jobName, setJobName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    files: '',
  });

  // ファイルが選択されチェックリストも選択されているかチェック
  const isReady = files.length > 0 && selectedChecklist !== null && jobName.trim() !== '';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'jobName') {
      setJobName(value);
    }
    
    // 入力時にエラーをクリア
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    
    // ファイル名をジョブ名の初期値として設定（ファイルが1つの場合）
    if (newFiles.length === 1 && !jobName) {
      // 拡張子を除いたファイル名を設定
      const fileName = newFiles[0].name;
      const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
      setJobName(`${nameWithoutExtension}の審査`);
    }
    
    // ファイル選択時にエラーをクリア
    if (errors.files) {
      setErrors(prev => ({
        ...prev,
        files: '',
      }));
    }
  };

  const handleChecklistSelect = (checklist: Checklist) => {
    setSelectedChecklist(checklist);
  };

  // バリデーション
  const validate = () => {
    const newErrors = {
      name: '',
      files: '',
    };
    
    if (!jobName.trim()) {
      newErrors.name = 'ジョブ名は必須です';
    }
    
    if (files.length === 0) {
      newErrors.files = '少なくとも1つのファイルを選択してください';
    }
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      // TBD: 実際のAPIを使用してジョブを作成する実装
      console.log('Creating job with:', {
        name: jobName,
        files,
        checklist: selectedChecklist
      });
      
      // 処理成功を模擬（実際はAPIレスポンスを待つ）
      setTimeout(() => {
        // 一覧画面に戻る
        navigate('/review');
      }, 1000);
    } catch (error) {
      console.error('Error creating job:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="新規審査ジョブ作成"
        description="新しい審査ジョブを作成し、ドキュメントとチェックリストを比較します"
        backLink={{
          to: "/review",
          label: "審査ジョブ一覧に戻る"
        }}
      />

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
                files={files}
                onFilesChange={handleFilesChange}
                required
                error={errors.files}
                isUploading={isSubmitting}
                multiple={false}
              />
            </div>

            {/* 中央: 比較アイコン */}
            <div className="lg:col-span-1 flex justify-center items-center py-4">
              <ComparisonIndicator isReady={isReady} />
            </div>

            {/* 右側: チェックリスト選択 */}
            <div className="lg:col-span-3">
              <ChecklistSelector
                checklists={mockChecklists}
                selectedChecklistId={selectedChecklist?.id || null}
                onSelectChecklist={handleChecklistSelect}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <Button
              variant="outline"
              to="/review"
            >
              キャンセル
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!isReady || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  処理中...
                </>
              ) : '比較実施'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewCreatePage;

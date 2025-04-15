import React from 'react';
import { FileUploader } from './FileUploader';

interface FormFileUploadProps {
  label: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  required?: boolean;
  error?: string;
  isUploading?: boolean;
  multiple?: boolean;
  className?: string;
  uploadedDocuments?: Array<{ documentId: string; filename: string }>;
}

/**
 * フォームファイルアップロードコンポーネント
 * ラベル付きのファイルアップローダーを表示する共通コンポーネント
 */
export const FormFileUpload: React.FC<FormFileUploadProps> = ({
  label,
  files,
  onFilesChange,
  required = false,
  error,
  isUploading = false,
  multiple = true,
  className = '',
  uploadedDocuments = [],
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      <label className="block text-aws-squid-ink-light dark:text-aws-font-color-white-dark font-medium mb-2">
        {label} {required && <span className="text-red">*</span>}
      </label>
      <FileUploader 
        files={files}
        onFilesChange={onFilesChange}
        isUploading={isUploading}
        multiple={multiple}
      />
      {error && (
        <p className="mt-1 text-red text-sm">{error}</p>
      )}
      
      {/* アップロード済みファイル一覧 */}
      {uploadedDocuments.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-aws-squid-ink-light dark:text-aws-font-color-white-dark mb-2">アップロード済みファイル:</h3>
          <ul className="text-sm">
            {uploadedDocuments.map((doc) => (
              <li key={doc.documentId} className="flex items-center text-aws-font-color-gray mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {doc.filename}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FormFileUpload;

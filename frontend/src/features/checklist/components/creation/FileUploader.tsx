/**
 * ファイルアップロードコンポーネント
 * 共通コンポーネントを使用するように変更
 */

import { FileUploader as CommonFileUploader } from '../../../../components/FileUploader';

interface FileUploaderProps {
  onFilesChange: (files: File[]) => void;
  files: File[];
}

/**
 * ファイルアップロードコンポーネント
 */
export function FileUploader({ onFilesChange, files }: FileUploaderProps) {
  return (
    <CommonFileUploader
      onFilesChange={onFilesChange}
      files={files}
      acceptedFileTypes={{
        'application/pdf': ['.pdf'],
        'image/png': ['.png'],
        'image/jpeg': ['.jpg', '.jpeg'],
      }}
      multiple={true}
    />
  );
}

/**
 * 共通ファイルアップロードコンポーネント
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export interface FileUploaderProps {
  onFilesChange: (files: File[]) => void;
  files: File[];
  acceptedFileTypes?: Record<string, string[]>;
  multiple?: boolean;
  isUploading?: boolean;
}

/**
 * 共通ファイルアップロードコンポーネント
 */
export function FileUploader({ 
  onFilesChange, 
  files, 
  acceptedFileTypes = {
    'application/pdf': ['.pdf'],
    'image/png': ['.png'],
    'image/jpeg': ['.jpg', '.jpeg'],
  },
  multiple = true,
  isUploading = false
}: FileUploaderProps) {
  // ファイルドロップ処理
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (isUploading) return; // アップロード中は新しいファイルを追加しない
    onFilesChange([...files, ...acceptedFiles]);
  }, [files, onFilesChange, isUploading]);
  
  // ドロップゾーン設定
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    multiple,
    disabled: isUploading // アップロード中は無効化
  });
  
  // ファイル削除
  const removeFile = (index: number) => {
    if (isUploading) return; // アップロード中は削除しない
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };
  
  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${
          isUploading 
            ? 'border-light-gray bg-aws-paper-light opacity-70 cursor-not-allowed' 
            : isDragActive 
              ? 'border-aws-sea-blue-light bg-aws-paper-light cursor-pointer' 
              : 'border-light-gray hover:border-aws-sea-blue-light cursor-pointer'
        }`}
      >
        <input {...getInputProps()} disabled={isUploading} />
        {isDragActive ? (
          <p className="text-aws-sea-blue-light">ファイルをドロップしてください</p>
        ) : isUploading ? (
          <div>
            <svg className="animate-spin h-12 w-12 mx-auto text-aws-sea-blue-light" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-aws-squid-ink-light">ファイルをアップロード中...</p>
          </div>
        ) : (
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-aws-font-color-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-aws-squid-ink-light">ファイルをドラッグ＆ドロップするか、クリックして選択してください</p>
            <p className="text-sm text-aws-font-color-gray mt-1">
              対応形式: {Object.values(acceptedFileTypes).flat().join(', ').replace(/\./g, '')}
            </p>
          </div>
        )}
      </div>
      
      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-aws-squid-ink-light mb-2">選択されたファイル ({files.length})</h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center justify-between p-2 bg-aws-paper-light rounded-md">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-aws-font-color-gray mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm truncate max-w-xs text-aws-squid-ink-light">{file.name}</span>
                  <span className="text-xs text-aws-font-color-gray ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className={`text-red hover:text-red ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  type="button"
                  disabled={isUploading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

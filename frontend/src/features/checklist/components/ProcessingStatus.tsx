/**
 * 処理ステータス表示コンポーネント
 */

import { useEffect } from 'react';
import { DocumentStatus } from '../types';

export interface DocumentStatusItem {
  document_id: string;
  filename: string;
  status: DocumentStatus;
}

interface ProcessingStatusProps {
  documents: DocumentStatusItem[];
  onAllCompleted?: () => void;
}

/**
 * ステータスに応じたラベルとスタイルを取得
 */
const getStatusInfo = (status: DocumentStatus) => {
  switch (status) {
    case 'pending':
      return {
        label: '待機中',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        icon: '⏳',
      };
    case 'processing':
      return {
        label: '処理中',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        icon: '🔄',
      };
    case 'completed':
      return {
        label: '完了',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        icon: '✅',
      };
    case 'failed':
      return {
        label: '失敗',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        icon: '❌',
      };
    default:
      return {
        label: '不明',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        icon: '❓',
      };
  }
};

/**
 * 処理ステータス表示コンポーネント
 */
export function ProcessingStatus({ documents, onAllCompleted }: ProcessingStatusProps) {
  // すべてのドキュメントが完了または失敗したかチェック
  useEffect(() => {
    if (documents.length === 0) return;
    
    const allCompleted = documents.every(
      doc => doc.status === 'completed' || doc.status === 'failed'
    );
    
    if (allCompleted && onAllCompleted) {
      onAllCompleted();
    }
  }, [documents, onAllCompleted]);
  
  // ドキュメントがない場合
  if (documents.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-3">処理ステータス</h3>
      
      <div className="space-y-3">
        {documents.map((document) => {
          const statusInfo = getStatusInfo(document.status);
          
          return (
            <div
              key={document.document_id}
              className="p-3 bg-gray-50 rounded flex items-center justify-between"
            >
              <div className="flex items-center">
                <span className="text-sm font-medium">{document.filename}</span>
              </div>
              
              <div className={`px-3 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.textColor} text-xs flex items-center`}>
                <span className="mr-1">{statusInfo.icon}</span>
                <span>{statusInfo.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

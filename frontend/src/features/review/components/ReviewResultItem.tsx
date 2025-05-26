/**
 * 個々の審査結果項目を表示するコンポーネント
 */
import { useState } from 'react';
import { ReviewResultDetailModel, REVIEW_RESULT, REVIEW_RESULT_STATUS, REVIEW_FILE_TYPE } from '../types';
import ReviewResultOverrideModal from './ReviewResultOverrideModal';
import Button from '../../../components/Button';
import { HiChevronDown, HiChevronRight, HiPencil } from 'react-icons/hi';
import Spinner from '../../../components/Spinner';
import DocumentPreview from '../../../components/DocumentPreview';
import ImagePreview from '../../../components/ImagePreview';

interface ReviewResultItemProps {
  result: ReviewResultDetailModel;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  confidenceThreshold: number;
  isLoadingChildren?: boolean;
  // 新規追加プロパティ
  documentType?: REVIEW_FILE_TYPE;
  documentS3Path?: string;
  documentFilename?: string;
}

export default function ReviewResultItem({ 
  result, 
  hasChildren, 
  isExpanded, 
  onToggleExpand,
  confidenceThreshold,
  isLoadingChildren,
  documentType,
  documentS3Path,
  documentFilename
}: ReviewResultItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 信頼度が閾値を下回る場合のスタイルを追加
  const isBelowThreshold = 
    result.confidenceScore !== null && 
    result.confidenceScore < confidenceThreshold;
  
  // 結果に基づいてバッジの色とテキストを決定
  const renderStatusBadge = () => {
    if (result.status === REVIEW_RESULT_STATUS.PROCESSING) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
          処理中
        </span>
      );
    }
    
    if (result.status === REVIEW_RESULT_STATUS.FAILED) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
          エラー
        </span>
      );
    }
    
    if (result.status === REVIEW_RESULT_STATUS.PENDING) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
          未処理
        </span>
      );
    }
    
    if (result.result === REVIEW_RESULT.PASS) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
          合格
        </span>
      );
    }
    
    if (result.result === REVIEW_RESULT.FAIL) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
          不合格
        </span>
      );
    }
    
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
        不明
      </span>
    );
  };
  
  // ユーザー上書きバッジ
  const renderUserOverrideBadge = () => {
    if (result.userOverride) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-aws-sea-blue-light bg-opacity-20 text-aws-sea-blue-light ml-2">
          ユーザー上書き
        </span>
      );
    }
    return null;
  };
  
  // 信頼度スコアの表示
  const renderConfidenceScore = () => {
    if (result.confidenceScore === null) return null;
    
    // 信頼度スコアに基づいて色を決定
    const getScoreColor = () => {
      if (result.confidenceScore >= confidenceThreshold) return 'text-aws-lab';
      return 'text-yellow';
    };
    
    return (
      <span className={`text-sm ${getScoreColor()} ${isBelowThreshold ? 'font-bold' : ''}`}>
        信頼度: {Math.round(result.confidenceScore * 100)}%
        {isBelowThreshold && (
          <span className="ml-1 text-yellow">⚠️</span>
        )}
      </span>
    );
  };
  
  // checkList が undefined の場合のフォールバック
  if (!result.checkList) {
    return (
      <div className="bg-white border border-light-gray rounded-md p-4">
        <div className="text-red">
          データエラー: チェックリスト情報がありません (ID: {result.checkId})
        </div>
        <div className="mt-2">
          <Button
            onClick={() => window.location.reload()}
            variant="secondary"
            size="sm"
          >
            再読み込み
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div 
        id={`result-item-${result.id}`}
        className={`bg-white border ${isBelowThreshold ? 'border-yellow border-2' : 'border-light-gray'} rounded-md p-4 hover:bg-aws-paper-light transition-colors ${isBelowThreshold ? 'bg-light-yellow' : ''}`}
>
        <div className="grid grid-cols-[auto_1fr_auto] gap-4">
          {/* 展開/折りたたみボタン - 1列目 */}
          <div className="pt-1">
            {hasChildren && (
              <button 
                onClick={onToggleExpand}
                className="text-aws-font-color-gray hover:text-aws-squid-ink-light transition-colors"
                disabled={isLoadingChildren}
              >
                {isExpanded ? (
                  isLoadingChildren ? (
                    <Spinner size="sm" />
                  ) : (
                    <HiChevronDown className="h-5 w-5" />
                  )
                ) : (
                  <HiChevronRight className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
          
          {/* 項目情報 - 2列目 */}
          <div>
            <div className="font-medium text-aws-squid-ink-light flex items-center">
              {result.checkList.name}
              <div className="ml-2">
                {renderStatusBadge()}
                {renderUserOverrideBadge()}
              </div>
            </div>
            
            <p className="text-sm text-aws-font-color-gray mt-1">
              {result.checkList.description || '説明なし'}
            </p>
            
            {/* 説明文と抽出テキスト */}
            {(result.explanation || result.extractedText || result.userComment) && (
              <div className="mt-3 grid grid-cols-1 gap-3">
                {result.explanation && (
                  <div className="bg-aws-paper-light rounded p-3 text-sm">
                    <p className="font-medium text-aws-squid-ink-light mb-1">AI判断:</p>
                    <p className="text-aws-font-color-gray">{result.explanation}</p>
                  </div>
                )}
                
                {result.extractedText && (
                  <div className="bg-aws-paper-light rounded p-3 text-sm">
                    <p className="font-medium text-aws-squid-ink-light mb-1">参照元:</p>
                    <p className="whitespace-pre-wrap text-aws-font-color-gray">{result.extractedText}</p>
                    
                    {/* 参照元ドキュメントの表示 */}
                    {result.sourceDocumentId && documentS3Path && documentFilename && (
                      <div className="mt-2 pt-2 border-t border-light-gray">
                        {documentType === REVIEW_FILE_TYPE.PDF ? (
                          <DocumentPreview 
                            s3Key={documentS3Path} 
                            filename={documentFilename} 
                            pageNumber={result.sourcePageNumber} 
                          />
                        ) : documentType === REVIEW_FILE_TYPE.IMAGE ? (
                          <ImagePreview 
                            s3Key={documentS3Path} 
                            filename={documentFilename} 
                          />
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
                
                {/* ユーザーコメント */}
                {result.userComment && (
                  <div className="bg-aws-sea-blue-light bg-opacity-10 rounded p-3 text-sm">
                    <p className="font-medium text-aws-squid-ink-light mb-1">ユーザーコメント:</p>
                    <p className="text-aws-font-color-gray">{result.userComment}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* 信頼度スコアと上書きボタン - 3列目 */}
          <div className="flex flex-col items-end space-y-2 self-start">
            {/* 子項目でない場合のみ信頼度スコアを表示 */}
            {!hasChildren && renderConfidenceScore()}
            
            {/* 子項目でない場合かつ結果が確定している場合のみ上書きボタンを表示 */}
            {!hasChildren && result.status === REVIEW_RESULT_STATUS.COMPLETED && (
              <Button
                onClick={() => setIsModalOpen(true)}
                variant="secondary"
                size="sm"
                icon={<HiPencil className="h-4 w-4" />}
              >
                結果を上書き
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* 上書きモーダル */}
      {isModalOpen && (
        <ReviewResultOverrideModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          result={result}
        />
      )}
    </>
  );
}

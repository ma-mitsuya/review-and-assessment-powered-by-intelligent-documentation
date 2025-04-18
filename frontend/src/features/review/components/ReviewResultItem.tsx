/**
 * 個々の審査結果項目を表示するコンポーネント
 */
import { useState } from 'react';
import { ReviewResultHierarchy } from '../types';
import { REVIEW_RESULT, REVIEW_RESULT_STATUS } from '../constants';
import ReviewResultOverrideModal from './ReviewResultOverrideModal';
import Button from '../../../components/Button';

interface ReviewResultItemProps {
  result: ReviewResultHierarchy;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function ReviewResultItem({ 
  result, 
  hasChildren, 
  isExpanded, 
  onToggleExpand 
}: ReviewResultItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
    if (result.user_override) {
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
    if (result.confidence_score === null) return null;
    
    // 信頼度スコアに基づいて色を決定
    const getScoreColor = () => {
      if (result.confidence_score >= 0.8) return 'text-aws-lab';
      if (result.confidence_score >= 0.6) return 'text-yellow';
      return 'text-red';
    };
    
    return (
      <span className={`text-sm ${getScoreColor()}`}>
        信頼度: {Math.round(result.confidence_score * 100)}%
      </span>
    );
  };
  
  // check_list が undefined の場合のフォールバック
  if (!result.check_list) {
    return (
      <div className="bg-white border border-light-gray rounded-md p-4">
        <div className="text-red">
          データエラー: チェックリスト情報がありません (ID: {result.check_id})
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
      <div className="bg-white border border-light-gray rounded-md p-4 hover:bg-aws-paper-light transition-colors">
        <div className="flex justify-between items-start">
          <div className="flex items-start">
            {/* 展開/折りたたみボタン - チェックリストコンポーネントと同様 */}
            {hasChildren && (
              <button 
                onClick={onToggleExpand}
                className="mr-2 text-aws-font-color-gray hover:text-aws-squid-ink-light transition-colors"
              >
                {isExpanded ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )}
            
            {/* 項目情報 */}
            <div className="flex-1">
              <div className="font-medium text-aws-squid-ink-light flex items-center">
                {result.check_list.name}
                <div className="ml-2">
                  {renderStatusBadge()}
                  {renderUserOverrideBadge()}
                </div>
              </div>
              
              <p className="text-sm text-aws-font-color-gray mt-1">
                {result.check_list.description || '説明なし'}
              </p>
              
              {/* 説明文と抽出テキスト */}
              {(result.explanation || result.extracted_text || result.user_comment) && (
                <div className="mt-3 space-y-3">
                  {result.explanation && (
                    <div className="bg-aws-paper-light rounded p-3 text-sm">
                      <p className="font-medium text-aws-squid-ink-light mb-1">AI判断:</p>
                      <p className="text-aws-font-color-gray">{result.explanation}</p>
                    </div>
                  )}
                  
                  {result.extracted_text && (
                    <div className="bg-aws-paper-light rounded p-3 text-sm">
                      <p className="font-medium text-aws-squid-ink-light mb-1">抽出テキスト:</p>
                      <p className="whitespace-pre-wrap text-aws-font-color-gray">{result.extracted_text}</p>
                    </div>
                  )}
                  
                  {/* ユーザーコメント */}
                  {result.user_comment && (
                    <div className="bg-aws-sea-blue-light bg-opacity-10 rounded p-3 text-sm">
                      <p className="font-medium text-aws-squid-ink-light mb-1">ユーザーコメント:</p>
                      <p className="text-aws-font-color-gray">{result.user_comment}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            {renderConfidenceScore()}
            
            {/* 結果が確定している場合のみ上書きボタンを表示 */}
            {result.status === REVIEW_RESULT_STATUS.COMPLETED && (
              <Button
                onClick={() => setIsModalOpen(true)}
                variant="secondary"
                size="sm"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                }
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

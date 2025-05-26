/**
 * 個々の審査結果項目を表示するコンポーネント
 */
import { useState } from 'react';
import { ReviewResultDetailModel, REVIEW_RESULT, REVIEW_RESULT_STATUS, REVIEW_FILE_TYPE } from '../types';
import ReviewResultOverrideModal from './ReviewResultOverrideModal';
import Button from '../../../components/Button';
import { HiChevronDown, HiChevronRight, HiPencil, HiChevronUp } from 'react-icons/hi';
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
  documents: Array<{
    id: string;
    filename: string;
    s3Path: string;
    fileType: REVIEW_FILE_TYPE;
  }>;
}

export default function ReviewResultItem({ 
  result, 
  hasChildren, 
  isExpanded, 
  onToggleExpand,
  confidenceThreshold,
  isLoadingChildren,
  documents
}: ReviewResultItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleReferencesCount, setVisibleReferencesCount] = useState(5); // 初期表示数
  
  // 参照元情報を取得
  const sourceReferences = result.sourceReferences || [];
  
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
              <Button 
                onClick={onToggleExpand}
                variant="text"
                size="sm"
                className="p-0"
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
              </Button>
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
                    
                    {/* 参照元ドキュメントの表示（一覧形式） */}
                    {sourceReferences.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-light-gray">
                        <p className="text-sm text-aws-font-color-gray mb-2">
                          参照元一覧 ({sourceReferences.length}件)
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {sourceReferences.slice(0, visibleReferencesCount).map((reference, index) => {
                            const doc = documents.find(d => d.id === reference.documentId);
                            if (!doc) return null;
                            
                            return (
                              <div key={`${reference.documentId}-${reference.pageNumber || index}`} className="border border-light-gray rounded p-2">
                                {doc.fileType === REVIEW_FILE_TYPE.PDF ? (
                                  <DocumentPreview 
                                    s3Key={doc.s3Path} 
                                    filename={doc.filename} 
                                    pageNumber={reference.pageNumber} 
                                  />
                                ) : doc.fileType === REVIEW_FILE_TYPE.IMAGE ? (
                                  <ImagePreview 
                                    s3Key={doc.s3Path} 
                                    filename={doc.filename} 
                                    thumbnailHeight={80} // サムネイルサイズを小さく
                                  />
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                        
                        {sourceReferences.length > visibleReferencesCount && (
                          <div className="mt-2 text-center">
                            <Button
                              onClick={() => setVisibleReferencesCount(prev => 
                                prev === sourceReferences.length ? 5 : sourceReferences.length
                              )}
                              variant="text"
                              size="sm"
                              icon={visibleReferencesCount === sourceReferences.length ? <HiChevronUp className="h-4 w-4" /> : <HiChevronDown className="h-4 w-4" />}
                            >
                              {visibleReferencesCount === sourceReferences.length ? '折りたたむ' : 'すべて表示'}
                            </Button>
                          </div>
                        )}
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

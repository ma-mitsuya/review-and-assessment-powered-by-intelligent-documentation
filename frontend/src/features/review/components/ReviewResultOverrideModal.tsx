/**
 * 審査結果をユーザーが上書きするためのモーダル
 */
import { useState } from 'react';
import { ReviewResultHierarchy, UpdateReviewResultParams } from '../types';
import { useReviewResultActions } from '../hooks/useReviewResultActions';
import { REVIEW_RESULT } from '../constants';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import FormTextArea from '../../../components/FormTextArea';
import RadioGroup from '../../../components/RadioGroup';
import { useToast } from '../../../contexts/ToastContext';
import { HiCheck } from 'react-icons/hi';

interface ReviewResultOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ReviewResultHierarchy;
}

export default function ReviewResultOverrideModal({
  isOpen,
  onClose,
  result
}: ReviewResultOverrideModalProps) {
  const { showToast } = useToast();
  const { updateReviewResult, isLoading } = useReviewResultActions();
  
  // フォーム状態
  const [formData, setFormData] = useState<UpdateReviewResultParams>({
    result: result.result || REVIEW_RESULT.UNKNOWN,
    userComment: result.user_comment || ''
  });
  
  // ラジオボタンの選択肢
  const resultOptions = [
    { value: REVIEW_RESULT.PASS, label: '合格' },
    { value: REVIEW_RESULT.FAIL, label: '不合格' }
  ];
  
  // フォーム入力ハンドラー
  const handleResultChange = (value: string) => {
    setFormData(prev => ({ ...prev, result: value }));
  };
  
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, userComment: e.target.value }));
  };
  
  // 保存ハンドラー
  const handleSave = async () => {
    try {
      // review_result_id から jobId を抽出する処理を修正
      // 実際の実装ではAPIの仕様に合わせて適切に処理する必要がある
      const jobId = result.review_job_id || result.review_result_id.split('-')[0];
      
      await updateReviewResult(
        jobId,
        result.review_result_id,
        formData
      );
      
      showToast({
        title: '審査結果を更新しました',
        type: 'success'
      });
      
      onClose();
    } catch (error) {
      showToast({
        title: '審査結果の更新に失敗しました',
        type: 'error'
      });
    }
  };
  
  if (!isOpen) return null;
  
  // check_list が undefined の場合のフォールバック
  if (!result.check_list) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="エラー"
      >
        <div className="text-red">データエラー: チェックリスト情報がありません</div>
      </Modal>
    );
  }
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="審査結果の上書き"
    >
      <div className="space-y-6">
        <div className="border-b border-light-gray pb-4">
          <h3 className="font-medium text-aws-squid-ink-light mb-2">チェック項目</h3>
          <p className="text-aws-squid-ink-light">{result.check_list.name}</p>
          <p className="text-sm text-aws-font-color-gray mt-1">
            {result.check_list.description || '説明なし'}
          </p>
        </div>
        
        <div className="border-b border-light-gray pb-4">
          <h3 className="font-medium text-aws-squid-ink-light mb-2">AI判断</h3>
          <p className="text-aws-font-color-gray">{result.explanation || '判断結果がありません'}</p>
        </div>
        
        <div className="border-b border-light-gray pb-4">
          <h3 className="font-medium text-aws-squid-ink-light mb-2">判定結果</h3>
          <RadioGroup
            name="result"
            options={resultOptions}
            value={formData.result}
            onChange={handleResultChange}
            inline={true}
          />
        </div>
        
        <div>
          <FormTextArea
            id="userComment"
            name="userComment"
            label="コメント"
            value={formData.userComment || ''}
            onChange={handleCommentChange}
            placeholder="上書きの理由や補足情報を入力してください"
            rows={4}
            className="mb-0"
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-light-gray">
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={isLoading}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            loading={isLoading}
            icon={<HiCheck className="h-5 w-5" />}
          >
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
}

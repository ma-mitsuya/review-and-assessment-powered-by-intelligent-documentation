import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCheckListItem, useCheckListItems, createCheckListItem, updateCheckListItem } from '../hooks/useCheckListItems';
import { useCheckListSet } from '../hooks/useCheckListSets';
import { CheckListItem } from '../types';

/**
 * チェックリスト項目作成・編集ページ
 */
export function CheckListItemFormPage() {
  const { setId, itemId } = useParams<{ setId: string; itemId: string }>();
  const navigate = useNavigate();
  const isEditMode = !!itemId;
  
  // チェックリストセットの情報を取得
  const { data: checkListSet } = useCheckListSet(setId);
  
  // 編集モードの場合、既存の項目データを取得
  const { data: existingItem, isLoading: itemLoading } = useCheckListItem(isEditMode ? itemId : undefined);
  
  // 親項目の選択肢として使用するチェックリスト項目一覧を取得
  const { data: checkListItems } = useCheckListItems(setId);
  
  // フォームの状態
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    item_type: 'SIMPLE' | 'FLOW';
    is_conclusion: boolean;
    parent_id?: string;
    flow_data?: {
      condition_type: string;
      next_if_yes?: string;
      next_if_no?: string;
    };
  }>({
    name: '',
    description: '',
    item_type: 'SIMPLE',
    is_conclusion: false,
    parent_id: undefined,
    flow_data: {
      condition_type: '適合性判断',
      next_if_yes: undefined,
      next_if_no: undefined
    }
  });
  
  // バリデーションエラー
  const [errors, setErrors] = useState({
    name: '',
    description: '',
    flow_data: ''
  });
  
  // 送信中の状態
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 編集モードの場合、データをフォームに設定
  useEffect(() => {
    if (isEditMode && existingItem) {
      setFormData({
        name: existingItem.name,
        description: existingItem.description || '',
        item_type: existingItem.item_type,
        is_conclusion: existingItem.is_conclusion,
        parent_id: existingItem.parent_id,
        flow_data: existingItem.flow_data || {
          condition_type: '適合性判断',
          next_if_yes: undefined,
          next_if_no: undefined
        }
      });
    }
  }, [isEditMode, existingItem]);
  
  // 入力値の変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'is_conclusion') {
      setFormData(prev => ({
        ...prev,
        is_conclusion: (e.target as HTMLInputElement).checked
      }));
    } else if (name.startsWith('flow_data.')) {
      const flowDataField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        flow_data: {
          ...prev.flow_data!,
          [flowDataField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
    
    // 入力時にエラーをクリア
    if (name === 'name' && errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    } else if (name.startsWith('flow_data.') && errors.flow_data) {
      setErrors(prev => ({ ...prev, flow_data: '' }));
    }
  };
  
  // バリデーション
  const validate = () => {
    const newErrors = {
      name: '',
      description: '',
      flow_data: ''
    };
    
    if (!formData.name.trim()) {
      newErrors.name = '名前は必須です';
    }
    
    if (formData.item_type === 'FLOW') {
      if (!formData.flow_data?.condition_type) {
        newErrors.flow_data = '条件タイプは必須です';
      }
    }
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };
  
  // フォーム送信ハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate() || !setId) return;
    
    setIsSubmitting(true);
    
    try {
      if (isEditMode && itemId) {
        // 更新処理
        await updateCheckListItem(itemId, formData);
        navigate(`/checklist/${setId}`, { replace: true });
      } else {
        // 新規作成処理
        const requestData = {
          ...formData,
          check_list_set_id: setId
        };
        await createCheckListItem(setId, requestData as Omit<CheckListItem, 'check_id'>);
        navigate(`/checklist/${setId}`, { replace: true });
      }
    } catch (error) {
      console.error('保存に失敗しました', error);
      alert('チェックリスト項目の保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if ((isEditMode && itemLoading) || !checkListSet) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-fastPulse rounded-full h-12 w-12 border-t-2 border-b-2 border-aws-sea-blue-light"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-8">
        <Link to={`/checklist/${setId}`} className="text-aws-font-color-blue hover:text-aws-sea-blue-light flex items-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {checkListSet.name}に戻る
        </Link>
        <h1 className="text-3xl font-bold text-aws-squid-ink-light">
          {isEditMode ? 'チェックリスト項目の編集' : 'チェックリスト項目の新規作成'}
        </h1>
        <p className="text-aws-font-color-gray mt-2">
          {checkListSet.name}のチェックリスト項目を{isEditMode ? '編集' : '作成'}します
        </p>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 border border-light-gray">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="name" className="block text-aws-squid-ink-light font-medium mb-2">
              名前 <span className="text-red">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-aws-sea-blue-light ${
                errors.name ? 'border-red' : 'border-light-gray'
              }`}
              placeholder="チェック項目の名前"
            />
            {errors.name && (
              <p className="mt-1 text-red text-sm">{errors.name}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-aws-squid-ink-light font-medium mb-2">
              説明
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-light-gray rounded-md focus:outline-none focus:ring-2 focus:ring-aws-sea-blue-light"
              placeholder="チェック項目の説明"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="parent_id" className="block text-aws-squid-ink-light font-medium mb-2">
              親項目
            </label>
            <select
              id="parent_id"
              name="parent_id"
              value={formData.parent_id || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-light-gray rounded-md focus:outline-none focus:ring-2 focus:ring-aws-sea-blue-light"
            >
              <option value="">親項目なし（ルート項目）</option>
              {checkListItems && checkListItems
                .filter(item => item.check_id !== itemId) // 自分自身を除外
                .map(item => (
                  <option key={item.check_id} value={item.check_id}>
                    {item.name}
                  </option>
                ))
              }
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-aws-squid-ink-light font-medium mb-2">
              項目タイプ
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="item_type"
                  value="SIMPLE"
                  checked={formData.item_type === 'SIMPLE'}
                  onChange={handleChange}
                  className="form-radio h-5 w-5 text-aws-sea-blue-light"
                />
                <span className="ml-2 text-aws-squid-ink-light">単純チェック</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="item_type"
                  value="FLOW"
                  checked={formData.item_type === 'FLOW'}
                  onChange={handleChange}
                  className="form-radio h-5 w-5 text-aws-sea-blue-light"
                />
                <span className="ml-2 text-aws-squid-ink-light">フローチェック</span>
              </label>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="is_conclusion"
                checked={formData.is_conclusion}
                onChange={handleChange}
                className="form-checkbox h-5 w-5 text-aws-sea-blue-light"
              />
              <span className="ml-2 text-aws-squid-ink-light">結論項目</span>
            </label>
            <p className="text-sm text-aws-font-color-gray mt-1">
              結論項目は、フローの最終結果を表します
            </p>
          </div>
          
          {/* フロータイプの場合の追加フィールド */}
          {formData.item_type === 'FLOW' && (
            <div className="mb-6 p-4 bg-aws-paper-light rounded-md border border-light-gray">
              <h3 className="text-lg font-medium text-aws-squid-ink-light mb-4">フロー設定</h3>
              
              <div className="mb-4">
                <label htmlFor="flow_data.condition_type" className="block text-aws-squid-ink-light font-medium mb-2">
                  条件タイプ <span className="text-red">*</span>
                </label>
                <input
                  type="text"
                  id="flow_data.condition_type"
                  name="flow_data.condition_type"
                  value={formData.flow_data?.condition_type || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-aws-sea-blue-light ${
                    errors.flow_data ? 'border-red' : 'border-light-gray'
                  }`}
                  placeholder="例: 適合性判断、書類確認など"
                />
                {errors.flow_data && (
                  <p className="mt-1 text-red text-sm">{errors.flow_data}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="flow_data.next_if_yes" className="block text-aws-squid-ink-light font-medium mb-2">
                  「はい」の場合の次の項目
                </label>
                <select
                  id="flow_data.next_if_yes"
                  name="flow_data.next_if_yes"
                  value={formData.flow_data?.next_if_yes || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-light-gray rounded-md focus:outline-none focus:ring-2 focus:ring-aws-sea-blue-light"
                >
                  <option value="">選択してください</option>
                  {checkListItems && checkListItems
                    .filter(item => item.check_id !== itemId) // 自分自身を除外
                    .map(item => (
                      <option key={item.check_id} value={item.check_id}>
                        {item.name}
                      </option>
                    ))
                  }
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="flow_data.next_if_no" className="block text-aws-squid-ink-light font-medium mb-2">
                  「いいえ」の場合の次の項目
                </label>
                <select
                  id="flow_data.next_if_no"
                  name="flow_data.next_if_no"
                  value={formData.flow_data?.next_if_no || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-light-gray rounded-md focus:outline-none focus:ring-2 focus:ring-aws-sea-blue-light"
                >
                  <option value="">選択してください</option>
                  {checkListItems && checkListItems
                    .filter(item => item.check_id !== itemId) // 自分自身を除外
                    .map(item => (
                      <option key={item.check_id} value={item.check_id}>
                        {item.name}
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Link
              to={`/checklist/${setId}`}
              className="px-5 py-2.5 border border-light-gray rounded-md text-aws-squid-ink-light hover:bg-aws-paper-light transition-colors"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-aws-sea-blue-light hover:bg-aws-sea-blue-hover-light text-aws-font-color-white-light px-5 py-2.5 rounded-md flex items-center transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isEditMode ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CheckListItemFormPage;

import { useState } from 'react';
import { useCheckListItems } from '../hooks/useCheckListItems';
import { HierarchicalCheckListItem } from '../types';

type CheckListItemAddModalProps = {
  isOpen: boolean;
  onClose: () => void;
  checkListSetId: string;
  hierarchyItems: HierarchicalCheckListItem[];
  onSuccess: () => void;
};

export default function CheckListItemAddModal({
  isOpen,
  onClose,
  checkListSetId,
  hierarchyItems,
  onSuccess
}: CheckListItemAddModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    itemType: 'simple' as 'simple' | 'flow',
    isConclusion: false,
    flowData: {
      condition_type: '適合性判断',
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    flowData: ''
  });
  
  // コンポーネントのトップレベルでフックを呼び出す
  const { createItem } = useCheckListItems(checkListSetId);

  // 入力値の変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'isConclusion') {
      setFormData(prev => ({
        ...prev,
        isConclusion: (e.target as HTMLInputElement).checked
      }));
    } else if (name.startsWith('flowData.')) {
      const flowDataField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        flowData: {
          ...prev.flowData,
          [flowDataField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
    
    // エラークリア
    if (name === 'name' && errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    } else if (name.startsWith('flowData.') && errors.flowData) {
      setErrors(prev => ({ ...prev, flowData: '' }));
    }
  };

  // バリデーション
  const validate = () => {
    const newErrors = {
      name: '',
      flowData: ''
    };
    
    if (!formData.name.trim()) {
      newErrors.name = '名前は必須です';
    }
    
    if (formData.itemType === 'flow' && !formData.flowData.condition_type) {
      newErrors.flowData = '条件タイプは必須です';
    }
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  // フォーム送信ハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      await createItem(checkListSetId, formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('保存に失敗しました', error);
      alert('チェックリスト項目の保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-aws-squid-ink-light">チェックリスト項目の追加</h2>
          <button
            onClick={onClose}
            className="text-aws-font-color-gray hover:text-aws-squid-ink-light"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
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
          
          <div className="mb-4">
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
          
          <div className="mb-4">
            <label htmlFor="parentId" className="block text-aws-squid-ink-light font-medium mb-2">
              親項目
            </label>
            <select
              id="parentId"
              name="parentId"
              value={formData.parentId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-light-gray rounded-md focus:outline-none focus:ring-2 focus:ring-aws-sea-blue-light"
            >
              <option value="">親項目なし（ルート項目）</option>
              {hierarchyItems.map(item => (
                <option key={item.check_id} value={item.check_id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-aws-squid-ink-light font-medium mb-2">
              項目タイプ
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="itemType"
                  value="simple"
                  checked={formData.itemType === 'simple'}
                  onChange={handleChange}
                  className="form-radio h-5 w-5 text-aws-sea-blue-light"
                />
                <span className="ml-2 text-aws-squid-ink-light">単純チェック</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="itemType"
                  value="flow"
                  checked={formData.itemType === 'flow'}
                  onChange={handleChange}
                  className="form-radio h-5 w-5 text-aws-sea-blue-light"
                />
                <span className="ml-2 text-aws-squid-ink-light">フローチェック</span>
              </label>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="isConclusion"
                checked={formData.isConclusion}
                onChange={handleChange}
                className="form-checkbox h-5 w-5 text-aws-sea-blue-light"
              />
              <span className="ml-2 text-aws-squid-ink-light">結論項目</span>
            </label>
            <p className="text-sm text-aws-font-color-gray mt-1">
              結論項目は、フローの最終結果を表します
            </p>
          </div>
          
          {formData.itemType === 'flow' && (
            <div className="mb-4 p-4 bg-aws-paper-light rounded-md border border-light-gray">
              <h3 className="text-lg font-medium text-aws-squid-ink-light mb-4">フロー設定</h3>
              
              <div className="mb-4">
                <label htmlFor="flowData.condition_type" className="block text-aws-squid-ink-light font-medium mb-2">
                  条件タイプ <span className="text-red">*</span>
                </label>
                <input
                  type="text"
                  id="flowData.condition_type"
                  name="flowData.condition_type"
                  value={formData.flowData.condition_type}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-aws-sea-blue-light ${
                    errors.flowData ? 'border-red' : 'border-light-gray'
                  }`}
                  placeholder="例: 適合性判断、書類確認など"
                />
                {errors.flowData && (
                  <p className="mt-1 text-red text-sm">{errors.flowData}</p>
                )}
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-light-gray rounded-md text-aws-squid-ink-light hover:bg-aws-paper-light transition-colors"
            >
              キャンセル
            </button>
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
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

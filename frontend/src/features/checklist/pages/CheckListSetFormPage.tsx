import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCheckListSet } from '../hooks/useCheckListSets';
import { postData, putData } from '../../../hooks/useFetch';

/**
 * チェックリストセット作成・編集ページ
 */
export function CheckListSetFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  // 編集モードの場合、既存のデータを取得
  const { data: existingData, error, isLoading } = useCheckListSet(isEditMode ? id : undefined);
  
  // フォームの状態
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  // バリデーションエラー
  const [errors, setErrors] = useState({
    name: '',
    description: ''
  });
  
  // 送信中の状態
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 編集モードの場合、データをフォームに設定
  useEffect(() => {
    if (isEditMode && existingData) {
      setFormData({
        name: existingData.name,
        description: existingData.description || ''
      });
    }
  }, [isEditMode, existingData]);
  
  // 入力値の変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 入力時にエラーをクリア
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // バリデーション
  const validate = () => {
    const newErrors = {
      name: '',
      description: ''
    };
    
    if (!formData.name.trim()) {
      newErrors.name = '名前は必須です';
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
      if (isEditMode && id) {
        // 更新処理
        await putData(`/checklist-sets/${id}`, formData);
        navigate(`/checklist/${id}`, { replace: true });
      } else {
        // 新規作成処理
        const response = await postData('/checklist-sets', formData);
        navigate(`/checklist/${response.data.check_list_set_id}`, { replace: true });
      }
    } catch (error) {
      console.error('保存に失敗しました', error);
      alert('チェックリストセットの保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isEditMode && isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-fastPulse rounded-full h-12 w-12 border-t-2 border-b-2 border-aws-sea-blue-light"></div>
      </div>
    );
  }
  
  if (isEditMode && error) {
    return (
      <div className="bg-light-red border border-red text-red px-6 py-4 rounded-lg shadow-sm" role="alert">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <strong className="font-medium">エラー: </strong>
          <span className="ml-2">チェックリストセットの取得に失敗しました。</span>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-8">
        <Link to="/checklist" className="text-aws-font-color-blue hover:text-aws-sea-blue-light flex items-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          チェックリスト一覧に戻る
        </Link>
        <h1 className="text-3xl font-bold text-aws-squid-ink-light">
          {isEditMode ? 'チェックリストセットの編集' : 'チェックリストセットの新規作成'}
        </h1>
        <p className="text-aws-font-color-gray mt-2">
          {isEditMode 
            ? 'チェックリストセットの情報を編集します' 
            : '新しいチェックリストセットを作成します'}
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
              placeholder="チェックリストセットの名前"
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
              rows={4}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-aws-sea-blue-light ${
                errors.description ? 'border-red' : 'border-light-gray'
              }`}
              placeholder="チェックリストセットの説明"
            />
            {errors.description && (
              <p className="mt-1 text-red text-sm">{errors.description}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <Link
              to={isEditMode && id ? `/checklist/${id}` : '/checklist'}
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

export default CheckListSetFormPage;

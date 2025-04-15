import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubmit } from '../../../hooks/useFetch';
import { useToast } from '../../../components/Toast';

/**
 * チェックリスト作成ページ
 */
export function CreateChecklistPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { submit, isLoading } = useSubmit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      addToast('チェックリスト名を入力してください', 'error');
      return;
    }

    try {
      const response = await submit('/checklist-sets', 'POST', {
        name,
        description,
        documents: []
      });

      if (response.success) {
        addToast(`チェックリスト「${name}」を作成しました`, 'success');
        navigate('/checklist');
      } else {
        addToast('チェックリストの作成に失敗しました', 'error');
      }
    } catch (error) {
      console.error('チェックリスト作成エラー:', error);
      addToast('チェックリストの作成に失敗しました', 'error');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-aws-font-color-light dark:text-aws-font-color-dark mb-6">
        チェックリスト作成
      </h1>

      <div className="bg-white shadow-md rounded-lg p-6 border border-light-gray">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-aws-font-color-light dark:text-aws-font-color-dark font-medium mb-2">
              チェックリスト名 <span className="text-red">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-light-gray rounded-md focus:outline-none focus:ring-2 focus:ring-aws-sea-blue-light"
              placeholder="チェックリスト名を入力"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-aws-font-color-light dark:text-aws-font-color-dark font-medium mb-2">
              説明
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-light-gray rounded-md focus:outline-none focus:ring-2 focus:ring-aws-sea-blue-light"
              placeholder="チェックリストの説明を入力"
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/checklist')}
              className="px-6 py-2 border border-light-gray rounded-md text-aws-font-color-light dark:text-aws-font-color-dark hover:bg-aws-paper-light transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-aws-sea-blue-light text-white rounded-md hover:bg-aws-sea-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

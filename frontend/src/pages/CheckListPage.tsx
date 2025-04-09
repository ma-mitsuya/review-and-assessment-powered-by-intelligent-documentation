import CheckListSetList from '../features/checklist/components/CheckListSetList';

/**
 * チェックリスト一覧ページ
 */
export default function CheckListPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-aws-squid-ink-light">チェックリスト管理</h1>
        <p className="text-aws-font-color-gray mt-2">
          不動産書類のチェックリストセットを管理します
        </p>
      </div>
      <CheckListSetList />
    </div>
  );
}

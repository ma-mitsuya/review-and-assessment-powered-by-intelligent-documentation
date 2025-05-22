/**
 * チェックリスト項目の階層構造を表示するツリーコンポーネント
 */
import { useCheckListItems } from '../hooks/useCheckListItemQueries';
import CheckListItemTreeNode from './CheckListItemTreeNode';
import { TreeSkeleton } from '../../../components/Skeleton';

interface CheckListItemTreeProps {
  setId: string;
  maxDepth?: number;
}

export default function CheckListItemTree({ setId, maxDepth = 2 }: CheckListItemTreeProps) {
  // ルート項目を取得
  const { 
    items: rootItems, 
    isLoading: isLoadingRoot,
    error: errorRoot
  } = useCheckListItems(setId || null);
  
  if (isLoadingRoot) {
    return <TreeSkeleton nodes={3} />;
  }
  
  if (errorRoot) {
    return (
      <div className="text-center py-10 text-red-500">
        チェックリスト項目の読み込みに失敗しました。
      </div>
    );
  }
  
  if (rootItems.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        チェックリスト項目がありません
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {rootItems.map((item) => (
        <CheckListItemTreeNode 
          key={item.id} 
          setId={setId}
          item={item} 
          level={0} 
          maxDepth={maxDepth}
        />
      ))}
    </div>
  );
}

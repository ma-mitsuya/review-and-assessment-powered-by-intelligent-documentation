/**
 * チェックリスト項目の階層構造のノードコンポーネント
 * 子要素を動的に読み込む機能を持つ
 */
import { useState } from 'react';
import { CheckListItemDetail } from '../types';
import { useChecklistItems } from '../hooks/useCheckListItemQueries';
import { HiChevronDown, HiChevronRight, HiPencil, HiTrash } from "react-icons/hi";
import CheckListItemEditModal from './CheckListItemEditModal';
import { useDeleteCheckListItem } from '../hooks/useCheckListItemMutations';
import Spinner from '../../../components/Spinner';
import { useChecklistSetDetail } from '../hooks/useCheckListSetQueries';

interface CheckListItemTreeNodeProps {
  setId: string;
  item: CheckListItemDetail;
  level: number;
  maxDepth?: number;
  autoExpand?: boolean;
}

export default function CheckListItemTreeNode({ 
  setId, 
  item, 
  level, 
  maxDepth = 2,
  autoExpand = false
}: CheckListItemTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < maxDepth || autoExpand);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const {
    deleteCheckListItem,
    status: delStatus,
    error: delError,
  } = useDeleteCheckListItem(item.setId);
  
  // チェックリストセットの詳細情報を取得
  const { checklistSet } = useChecklistSetDetail(setId || null);
  const isEditable = checklistSet?.isEditable ?? true;
  
  console.log(`[Frontend] CheckListItemTreeNode - setId: ${setId}, itemId: ${item.id}, level: ${level}, hasChildren: ${item.hasChildren}`);
  
  // 子項目を取得（レベルが最大深度未満の場合は自動的に、それ以外は展開時に）
  const shouldLoadChildren = item.hasChildren && (level < maxDepth || isExpanded);
  console.log(`[Frontend] shouldLoadChildren: ${shouldLoadChildren}, parentId: ${shouldLoadChildren ? item.id : 'undefined'}`);
  
  const { 
    items: childItems, 
    isLoading: isLoadingChildren,
    error: errorChildren
  } = useChecklistItems(
    setId || null,
    shouldLoadChildren ? item.id : undefined
  );
  
  console.log(`[Frontend] Child items loaded: ${childItems.length}, isLoading: ${isLoadingChildren}, error: ${errorChildren ? 'yes' : 'no'}`);
  
  // 展開/折りたたみの切り替え
  const toggleExpand = () => {
    console.log(`[Frontend] Toggling expand for ${item.id} from ${isExpanded} to ${!isExpanded}`);
    setIsExpanded(!isExpanded);
  };
  
  // インデントのスタイル
  const indentStyle = {
    marginLeft: `${level * 20}px`,
  };

  const handleDelete = async () => {
    if (!isEditable) return;
    if (!confirm(`「${item.name}」を本当に削除しますか？`)) return;
    try {
      await deleteCheckListItem(item.id);
    } catch {
      alert("削除に失敗しました。");
    }
  };
  
  return (
    <div>
      <div style={indentStyle}>
        <div className="bg-white border border-light-gray rounded-md p-4 hover:bg-aws-paper-light transition-colors flex justify-between items-center">
          <div className="flex items-center">
            {item.hasChildren && (
              <button
                onClick={toggleExpand}
                className="mr-2 text-aws-font-color-gray hover:text-aws-squid-ink-light transition-colors"
              >
                {isExpanded ? (
                  <HiChevronDown className="h-5 w-5" />
                ) : (
                  <HiChevronRight className="h-5 w-5" />
                )}
              </button>
            )}
            <div>
              <div className="font-medium text-aws-squid-ink-light flex items-center">
                {item.name}
              </div>
              {item.description && (
                <p className="text-sm text-aws-font-color-gray mt-1">
                  {item.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => isEditable && setIsEditModalOpen(true)}
              className={`${isEditable ? "text-aws-aqua hover:text-aws-sea-blue-light" : "text-gray-300 cursor-not-allowed"}`}
              aria-label="編集"
              disabled={!isEditable}
            >
              <HiPencil className="h-5 w-5" />
            </button>
            <button
              onClick={handleDelete}
              className={`${isEditable ? "text-red hover:text-light-red hover:bg-light-red" : "text-gray-300 cursor-not-allowed"} rounded p-1 transition-colors`}
              aria-label="削除"
              disabled={!isEditable}
            >
              <HiTrash className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {isEditModalOpen && (
        <CheckListItemEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          item={item}
          checkListSetId={item.setId}
        />
      )}
      
      {/* 子項目を表示（展開時のみ） */}
      {isExpanded && item.hasChildren && (
        <div className="mt-2 space-y-2">
          {isLoadingChildren ? (
            <div className="flex justify-center py-4" style={{marginLeft: `${(level + 1) * 20}px`}}>
              <Spinner size="md" />
            </div>
          ) : errorChildren ? (
            <div className="text-red-500 py-2" style={{marginLeft: `${(level + 1) * 20}px`}}>
              子項目の読み込みに失敗しました。
            </div>
          ) : childItems.length > 0 ? (
            childItems.map(childItem => (
              <CheckListItemTreeNode 
                key={childItem.id} 
                setId={setId}
                item={childItem} 
                level={level + 1}
                maxDepth={maxDepth}
              />
            ))
          ) : (
            <div className="text-gray-500 py-2" style={{marginLeft: `${(level + 1) * 20}px`}}>
              子項目はありません
            </div>
          )}
        </div>
      )}
    </div>
  );
}

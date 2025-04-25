import { useState } from 'react';
import { HierarchicalCheckListItem } from '../types';
import CheckListItemEditModal from './CheckListItemEditModal';

type CheckListItemTreeProps = {
  items: HierarchicalCheckListItem[];
};

/**
 * チェックリスト項目を階層構造で表示するコンポーネント
 */
export default function CheckListItemTree({ items }: CheckListItemTreeProps) {
  // ルート項目（親を持たない項目）を抽出
  const rootItems = items.filter(item => !item.parent_id);
  
  return (
    <div className="space-y-4">
      {rootItems.map(item => (
        <CheckListItemNode 
          key={item.check_id} 
          item={item} 
          level={0} 
        />
      ))}
    </div>
  );
}

type CheckListItemNodeProps = {
  item: HierarchicalCheckListItem;
  level: number;
};

/**
 * チェックリスト項目の個別ノードコンポーネント
 */
function CheckListItemNode({ item, level }: CheckListItemNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // 子項目は階層構造データから直接取得
  const hasChildren = item.children && item.children.length > 0;
  
  // インデントのスタイル
  const indentStyle = {
    marginLeft: `${level * 20}px`,
  };
  
  // 項目タイプに応じたバッジ
  const typeBadge = item.item_type === 'flow' ? (
    <span className="bg-aws-aqua text-aws-font-color-white-light text-xs px-2 py-1 rounded-full ml-2">
      フロー
    </span>
  ) : (
    <span className="bg-aws-sea-blue-light text-aws-font-color-white-light text-xs px-2 py-1 rounded-full ml-2">
      単純
    </span>
  );
  
  // 結論項目の場合のバッジ
  const conclusionBadge = item.is_conclusion && (
    <span className="bg-aws-orange text-aws-font-color-white-light text-xs px-2 py-1 rounded-full ml-2">
      結論
    </span>
  );
  
  return (
    <div>
      <div 
        className="bg-white border border-light-gray rounded-md p-4 hover:bg-aws-paper-light transition-colors"
        style={indentStyle}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {hasChildren && (
              <button 
                onClick={() => setExpanded(!expanded)}
                className="mr-2 text-aws-font-color-gray hover:text-aws-squid-ink-light transition-colors"
              >
                {expanded ? (
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
            <div>
              <div className="font-medium text-aws-squid-ink-light flex items-center">
                {item.name}
                {typeBadge}
                {conclusionBadge}
              </div>
              {item.description && (
                <p className="text-sm text-aws-font-color-gray mt-1">{item.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="text-aws-aqua hover:text-aws-sea-blue-light"
              aria-label="編集"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* フロー型の場合、追加情報を表示 */}
        {item.item_type === 'flow' && item.flow_data && (
          <div className="mt-3 pl-7 text-sm text-aws-font-color-gray">
            <div className="flex items-center">
              <span className="font-medium mr-2">条件タイプ:</span>
              <span>{item.flow_data.condition_type}</span>
            </div>
            {item.flow_data.next_if_yes && (
              <div className="flex items-center">
                <span className="font-medium mr-2">Yes の場合:</span>
                <span>{item.flow_data.next_if_yes}</span>
              </div>
            )}
            {item.flow_data.next_if_no && (
              <div className="flex items-center">
                <span className="font-medium mr-2">No の場合:</span>
                <span>{item.flow_data.next_if_no}</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 編集モーダル */}
      {isEditModalOpen && (
        <CheckListItemEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          item={item}
          checkListSetId={item.check_list_set_id}
        />
      )}
      
      {/* 子項目を表示（展開時のみ） */}
      {expanded && hasChildren && (
        <div className="mt-2 space-y-2">
          {item.children.map(child => (
            <CheckListItemNode 
              key={child.check_id} 
              item={child} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

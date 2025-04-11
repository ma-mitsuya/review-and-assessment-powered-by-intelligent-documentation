import { useState } from 'react';
import { CheckListItem } from '../../../types/api';
import CheckListItemTree from './CheckListItemTree';
import CheckListFlowChart from './CheckListFlowChart';
import { useCheckListFlow } from '../hooks/useCheckListFlow';

type CheckListViewerProps = {
  items: CheckListItem[];
  initialItemId?: string;
};

/**
 * チェックリスト表示コンポーネント
 * ツリー表示とフローチャート表示を切り替え可能
 */
export default function CheckListViewer({ items, initialItemId }: CheckListViewerProps) {
  const {
    selectedItemId,
    viewMode,
    selectItem,
    toggleViewMode,
  } = useCheckListFlow(items, initialItemId);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-aws-squid-ink-light">
          チェックリスト項目
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={toggleViewMode}
            className={`px-4 py-2 rounded-md transition-colors ${
              viewMode === 'tree'
                ? 'bg-aws-sea-blue-light text-white'
                : 'bg-white text-aws-squid-ink-light border border-aws-sea-blue-light'
            }`}
          >
            ツリー表示
          </button>
          <button
            onClick={toggleViewMode}
            className={`px-4 py-2 rounded-md transition-colors ${
              viewMode === 'flow'
                ? 'bg-aws-sea-blue-light text-white'
                : 'bg-white text-aws-squid-ink-light border border-aws-sea-blue-light'
            }`}
          >
            フローチャート表示
          </button>
        </div>
      </div>
      
      {viewMode === 'tree' ? (
        <CheckListItemTree items={items} />
      ) : (
        <div className="border border-light-gray rounded-lg overflow-hidden bg-white">
          <CheckListFlowChart items={items} selectedItemId={selectedItemId} />
        </div>
      )}
    </div>
  );
}

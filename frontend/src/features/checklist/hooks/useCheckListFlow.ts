import { useState, useEffect } from 'react';
import { HierarchicalCheckListItem } from '../types';

/**
 * チェックリストのフロー表示に関するカスタムフック
 */
export function useCheckListFlow(items: HierarchicalCheckListItem[], initialItemId?: string) {
  // 現在選択されているチェックリスト項目のID
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(initialItemId);
  
  // 選択された項目
  const selectedItem = items.find(item => item.check_id === selectedItemId);
  
  // フローチャートの表示モード
  const [viewMode, setViewMode] = useState<'tree' | 'flow'>('tree');
  
  // 項目を選択する関数
  const selectItem = (itemId: string) => {
    setSelectedItemId(itemId);
  };
  
  // 表示モードを切り替える関数
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'tree' ? 'flow' : 'tree');
  };
  
  // 初期項目IDが変更された場合に選択項目を更新
  useEffect(() => {
    if (initialItemId) {
      setSelectedItemId(initialItemId);
    }
  }, [initialItemId]);
  
  return {
    selectedItemId,
    selectedItem,
    viewMode,
    selectItem,
    toggleViewMode,
  };
}

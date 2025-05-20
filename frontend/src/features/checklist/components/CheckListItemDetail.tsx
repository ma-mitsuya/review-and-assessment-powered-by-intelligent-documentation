import { useState } from "react";
import type { CheckListItemModel } from "../types";
import {
  HiChevronDown,
  HiChevronRight,
  HiPencil,
  HiTrash,
} from "react-icons/hi";
import CheckListItemEditModal from "./CheckListItemEditModal";
import { useDeleteCheckListItem } from "../hooks/useCheckListItemMutations";

type HierarchicalItem = CheckListItemModel & {
  children: HierarchicalItem[];
};

/**
 * チェックリスト項目を階層構造で表示するコンポーネント
 * props.items は ネスト済み配列 (children を持つ) を想定
 */
export default function CheckListItemDetail({
  items,
}: {
  items: HierarchicalItem[];
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-aws-squid-ink-light">
          チェックリスト項目
        </h2>
      </div>
      <div className="space-y-2">
        {items.map((node) => (
          <Node key={node.id} node={node} level={0} />
        ))}
      </div>
    </div>
  );
}

type NodeProps = {
  node: HierarchicalItem;
  level: number;
};

function Node({ node, level }: NodeProps) {
  const [expanded, setExpanded] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const {
    deleteCheckListItem,
    status: delStatus,
    error: delError,
  } = useDeleteCheckListItem(node.setId);

  const indentStyle = { marginLeft: `${level * 20}px` };

  const handleDelete = async () => {
    if (!confirm(`「${node.name}」を本当に削除しますか？`)) return;
    try {
      await deleteCheckListItem(node.id);
    } catch {
      alert("削除に失敗しました。");
    }
  };

  return (
    <div style={indentStyle}>
      <div className="bg-white border border-light-gray rounded-md p-4 hover:bg-aws-paper-light transition-colors flex justify-between items-center">
        <div className="flex items-center">
          {node.children.length > 0 && (
            <button
              onClick={() => setExpanded((o) => !o)}
              className="mr-2 text-aws-font-color-gray hover:text-aws-squid-ink-light transition-colors"
            >
              {expanded ? (
                <HiChevronDown className="h-5 w-5" />
              ) : (
                <HiChevronRight className="h-5 w-5" />
              )}
            </button>
          )}
          <div>
            <div className="font-medium text-aws-squid-ink-light flex items-center">
              {node.name}
            </div>
            {node.description && (
              <p className="text-sm text-aws-font-color-gray mt-1">
                {node.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="text-aws-aqua hover:text-aws-sea-blue-light"
            aria-label="編集"
          >
            <HiPencil className="h-5 w-5" />
          </button>
          <button
            onClick={handleDelete}
            className="text-red hover:text-light-red hover:bg-light-red rounded p-1 disabled:opacity-50 transition-colors"
            aria-label="削除"
          >
            <HiTrash className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isEditModalOpen && (
        <CheckListItemEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          item={node}
          checkListSetId={node.setId}
        />
      )}

      {expanded &&
        node.children.length > 0 &&
        node.children.map((child) => (
          <div className="mt-2 space-y-2">
            <Node key={child.id} node={child} level={level + 1} />
          </div>
        ))}
    </div>
  );
}

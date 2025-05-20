import React, { useState } from "react";
import { CheckListItemModel } from "../types";
import CheckListItemEditModal from "./CheckListItemEditModal";
import { HiChevronDown, HiChevronRight, HiPencil } from "react-icons/hi";

// 階層構造化したチェックリスト項目の型
interface HierarchicalCheckListItem extends CheckListItemModel {
  children: HierarchicalCheckListItem[];
}

type CheckListItemDetailProps = {
  items: CheckListItemModel[]; // フラットなリストを受け取る
};

// フラットな配列を階層構造に変換するユーティリティ関数
const buildHierarchy = (
  items: CheckListItemModel[]
): HierarchicalCheckListItem[] => {
  const map: Record<string, HierarchicalCheckListItem> = {};
  // 初期マッピング
  items.forEach((item) => {
    map[item.id] = { ...item, children: [] };
  });

  const roots: HierarchicalCheckListItem[] = [];

  items.forEach((item) => {
    const node = map[item.id];
    if (item.parentId && map[item.parentId]) {
      map[item.parentId].children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

/**
 * チェックリスト項目を階層構造で表示するコンポーネント
 */
export default function CheckListItemDetail({
  items,
}: CheckListItemDetailProps) {
  // 階層構造に変換
  const rootItems = buildHierarchy(items);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-aws-squid-ink-light">
          チェックリスト項目
        </h2>
      </div>

      <div className="space-y-4">
        {rootItems.map((item) => (
          <CheckListItemNode key={item.id} item={item} level={0} />
        ))}
      </div>
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

  const hasChildren = item.children.length > 0;

  const indentStyle = { marginLeft: `${level * 20}px` };

  const badges = [];
  if (item.isConclusion) {
    badges.push(
      <span
        key="conclusion-badge"
        className="bg-aws-orange text-aws-font-color-white-light text-xs px-2 py-1 rounded-full ml-2"
      >
        結論
      </span>
    );
  }

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
                  <HiChevronDown className="h-5 w-5" />
                ) : (
                  <HiChevronRight className="h-5 w-5" />
                )}
              </button>
            )}
            <div>
              <div className="font-medium text-aws-squid-ink-light flex items-center">
                {item.name}
                {badges.map((badge, idx) => (
                  <React.Fragment key={idx}>{badge}</React.Fragment>
                ))}
              </div>
              {item.description && (
                <p className="text-sm text-aws-font-color-gray mt-1">
                  {item.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="text-aws-aqua hover:text-aws-sea-blue-light"
              aria-label="編集"
            >
              <HiPencil className="h-5 w-5" />
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

      {expanded && hasChildren && (
        <div className="mt-2 space-y-2">
          {item.children.map((child) => (
            <CheckListItemNode key={child.id} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

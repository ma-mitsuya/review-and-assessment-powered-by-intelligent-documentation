import React from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { HiInformationCircle } from "react-icons/hi";
import { PromptTemplate } from "../types";
import { PROMPT_TYPE_LABELS } from "../constants";

interface PromptTemplateListProps {
  templates: PromptTemplate[];
  onEdit: (template: PromptTemplate) => void;
  onDelete: (template: PromptTemplate) => void;
  onSetDefault: (template: PromptTemplate) => void;
  onCreateNew: () => void;
  isLoading: boolean;
}

export const PromptTemplateList: React.FC<PromptTemplateListProps> = ({
  templates,
  onEdit,
  onDelete,
  onSetDefault,
  onCreateNew,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-aws-sea-blue-light dark:border-aws-sea-blue-dark"></div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="bg-light-yellow border border-yellow text-yellow px-6 py-4 rounded-lg shadow-sm" role="alert">
        <div className="flex items-center">
          <HiInformationCircle className="h-6 w-6 mr-2" />
          <span>テンプレートがありません。新規作成してください。</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-light-gray">
      <table className="min-w-full divide-y divide-light-gray">
        <thead className="bg-aws-paper-light">
          <tr>
            <th
              scope="col"
              className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider"
            >
              名前
            </th>
            <th
              scope="col"
              className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider"
            >
              タイプ
            </th>
            <th
              scope="col"
              className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider"
            >
              説明
            </th>
            <th
              scope="col"
              className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider"
            >
              最終更新
            </th>
            <th
              scope="col"
              className="px-6 py-4 text-left text-xs font-medium text-aws-font-color-gray uppercase tracking-wider"
            >
              アクション
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-light-gray">
          {templates.map((template) => (
            <tr
              key={template.id}
              className="hover:bg-aws-paper-light transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-aws-squid-ink-light">
                  {template.name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-aws-font-color-gray">
                  {PROMPT_TYPE_LABELS[template.type] || template.type}
                </div>
              </td>
              <td className="px-6 py-4">
                <div
                  className="text-sm text-aws-font-color-gray max-w-xs truncate"
                  title={template.description || ""} // ホバー時にツールチップで全文表示
                >
                  {template.description || "-"}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-aws-font-color-gray">
                  {new Date(template.updatedAt).toLocaleString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => onEdit(template)}
                    className="text-aws-font-color-blue hover:text-aws-sea-blue-light flex items-center"
                  >
                    <FiEdit2 className="h-4 w-4 mr-1" />
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(template)}
                    className="text-red hover:text-light-red flex items-center"
                  >
                    <FiTrash2 className="h-4 w-4 mr-1" />
                    削除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

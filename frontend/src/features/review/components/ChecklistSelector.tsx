import React from 'react';
import { CheckListSet } from '../../../features/checklist/types';

interface ChecklistSelectorProps {
  checklists: CheckListSet[];
  selectedChecklistId: string | null;
  onSelectChecklist: (checklist: CheckListSet) => void;
}

export const ChecklistSelector: React.FC<ChecklistSelectorProps> = ({
  checklists,
  selectedChecklistId,
  onSelectChecklist,
}) => {
  return (
    <div className="bg-white dark:bg-aws-squid-ink-dark rounded-md shadow-sm border border-light-gray overflow-hidden">
      <div className="p-4 border-b border-light-gray">
        <h3 className="text-lg font-medium text-aws-squid-ink-light dark:text-aws-font-color-white-dark">
          チェックリスト選択
        </h3>
        <p className="text-sm text-aws-font-color-gray mt-1">
          審査に使用するチェックリストを選択してください
        </p>
      </div>

      <div className="divide-y divide-light-gray">
        {checklists.map((checklist) => (
          <div
            key={checklist.check_list_set_id}
            className={`p-4 cursor-pointer transition-colors ${
              selectedChecklistId === checklist.check_list_set_id
                ? 'bg-aws-sea-blue-light bg-opacity-10'
                : 'hover:bg-aws-paper-light'
            }`}
            onClick={() => onSelectChecklist(checklist)}
          >
            <div className="flex items-center">
              <input
                type="radio"
                id={`checklist-${checklist.check_list_set_id}`}
                name="checklist"
                checked={selectedChecklistId === checklist.check_list_set_id}
                onChange={() => onSelectChecklist(checklist)}
                className="h-4 w-4 text-aws-sea-blue-light focus:ring-aws-sea-blue-light"
              />
              <label
                htmlFor={`checklist-${checklist.check_list_set_id}`}
                className="ml-3 block text-aws-squid-ink-light dark:text-aws-font-color-white-dark cursor-pointer"
              >
                <span className="font-medium">{checklist.name}</span>
                <p className="text-sm text-aws-font-color-gray mt-1">
                  {checklist.description}
                </p>
                <p className="text-xs text-aws-font-color-gray mt-1">
                  ステータス: {checklist.processing_status}
                </p>
              </label>
            </div>
          </div>
        ))}
      </div>

      {checklists.length === 0 && (
        <div className="p-4 text-center text-aws-font-color-gray">
          利用可能なチェックリストがありません
        </div>
      )}
    </div>
  );
};

export default ChecklistSelector;

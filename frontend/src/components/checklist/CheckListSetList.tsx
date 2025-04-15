import { CheckListSet } from '../../features/checklist/types';
import { CheckListSetCard } from './CheckListSetCard';

interface CheckListSetListProps {
  checkListSets: CheckListSet[];
}

export function CheckListSetList({ checkListSets }: CheckListSetListProps) {
  if (checkListSets.length === 0) {
    return (
      <div className="bg-aws-font-color-white-light dark:bg-aws-ui-color-dark shadow-md rounded-lg p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-aws-font-color-light dark:text-aws-font-color-dark">チェックリストセットがありません</h3>
        <p className="mt-2 text-aws-font-color-gray">
          新規作成ボタンをクリックして、最初のチェックリストセットを作成しましょう。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {checkListSets.map((checkListSet) => (
        <CheckListSetCard
          key={checkListSet.check_list_set_id}
          checkListSet={checkListSet}
        />
      ))}
    </div>
  );
}

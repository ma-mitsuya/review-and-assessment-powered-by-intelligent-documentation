import { Link } from 'react-router-dom';
import { CheckListSet } from '../../features/checklist/types';

interface CheckListSetCardProps {
  checkListSet: CheckListSet;
}

export function CheckListSetCard({ checkListSet }: CheckListSetCardProps) {
  // ステータスに応じたバッジの色とラベルを取得
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: '待機中',
          bgColor: 'bg-light-yellow',
          textColor: 'text-yellow',
        };
      case 'in_progress':
        return {
          label: '処理中',
          bgColor: 'bg-aws-mist',
          textColor: 'text-aws-sea-blue-light',
        };
      case 'completed':
        return {
          label: '完了',
          bgColor: 'bg-aws-lab',
          textColor: 'text-aws-sea-blue-light',
        };
      default:
        return {
          label: '不明',
          bgColor: 'bg-light-gray',
          textColor: 'text-dark-gray',
        };
    }
  };
  
  const statusBadge = getStatusBadge(checkListSet.processing_status);
  
  return (
    <div className="bg-aws-font-color-white-light dark:bg-aws-ui-color-dark shadow-md rounded-lg p-6 border border-light-gray">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-aws-font-color-light dark:text-aws-font-color-dark">
            <Link to={`/checklist/${checkListSet.check_list_set_id}`} className="hover:text-aws-font-color-blue">
              {checkListSet.name}
            </Link>
          </h3>
          {checkListSet.description && (
            <p className="mt-2 text-aws-font-color-gray">{checkListSet.description}</p>
          )}
        </div>
        
        <div className={`px-3 py-1 rounded-full ${statusBadge.bgColor} ${statusBadge.textColor} text-xs`}>
          {statusBadge.label}
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <Link
          to={`/checklist/${checkListSet.check_list_set_id}`}
          className="px-3 py-1.5 text-aws-font-color-blue hover:text-aws-sea-blue-light"
        >
          詳細
        </Link>
      </div>
    </div>
  );
}

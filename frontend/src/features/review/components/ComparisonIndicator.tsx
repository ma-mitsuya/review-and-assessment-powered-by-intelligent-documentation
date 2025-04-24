import React from 'react';
import { HiDocumentDuplicate, HiChevronDoubleRight } from 'react-icons/hi';

interface ComparisonIndicatorProps {
  isReady: boolean;
}

export const ComparisonIndicator: React.FC<ComparisonIndicatorProps> = ({ isReady }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
        isReady 
          ? 'bg-aws-sea-blue-light text-aws-font-color-white-light' 
          : 'bg-light-gray text-aws-font-color-gray'
      }`}>
        <HiDocumentDuplicate className="h-8 w-8" />
      </div>
      
      <div className="mt-4 text-center">
        <p className={`font-medium ${isReady ? 'text-aws-squid-ink-light' : 'text-aws-font-color-gray'}`}>
          {isReady ? '比較準備完了' : 'ファイルとチェックリストを選択'}
        </p>
        <p className="text-sm text-aws-font-color-gray mt-1">
          {isReady 
            ? 'ドキュメントとチェックリストの比較を実行できます' 
            : '比較を実行するには両方を選択してください'
          }
        </p>
      </div>
      
      <div className="mt-6">
        <div className="flex items-center">
          <div className="w-16 h-0.5 bg-aws-sea-blue-light"></div>
          <HiChevronDoubleRight className="h-6 w-6 text-aws-sea-blue-light mx-2" />
          <div className="w-16 h-0.5 bg-aws-sea-blue-light"></div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonIndicator;

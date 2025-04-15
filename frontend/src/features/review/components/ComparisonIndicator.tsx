import React from 'react';

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
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-8 w-8" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
          />
        </svg>
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
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6 text-aws-sea-blue-light mx-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 5l7 7-7 7M5 5l7 7-7 7" 
            />
          </svg>
          <div className="w-16 h-0.5 bg-aws-sea-blue-light"></div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonIndicator;

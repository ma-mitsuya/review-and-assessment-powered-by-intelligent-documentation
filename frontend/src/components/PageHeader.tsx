import React from 'react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  description?: string;
  backLink?: {
    to: string;
    label: string;
  };
}

/**
 * ページヘッダーコンポーネント
 * タイトル、説明文、戻るリンクを表示する共通コンポーネント
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, backLink }) => {
  return (
    <div className="mb-8">
      {backLink && (
        <Link to={backLink.to} className="text-aws-font-color-blue hover:text-aws-sea-blue-light flex items-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {backLink.label}
        </Link>
      )}
      <h1 className="text-3xl font-bold text-aws-squid-ink-light dark:text-aws-font-color-dark">{title}</h1>
      {description && (
        <p className="text-aws-font-color-gray mt-2">{description}</p>
      )}
    </div>
  );
};

export default PageHeader;

import { Link } from 'react-router-dom';

/**
 * 404 Not Found ページ
 */
export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-aws-paper-light mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-aws-sea-blue-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-6xl font-bold text-aws-squid-ink-light mb-4">404</h1>
      <h2 className="text-3xl font-semibold text-aws-squid-ink-light mb-6">ページが見つかりません</h2>
      <p className="text-aws-font-color-gray mb-8 max-w-md">
        お探しのページは存在しないか、移動または削除された可能性があります。
      </p>
      <Link
        to="/"
        className="bg-aws-sea-blue-light hover:bg-aws-sea-blue-hover-light text-aws-font-color-white-light px-6 py-3 rounded-md font-medium inline-flex items-center transition-colors shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        ホームに戻る
      </Link>
    </div>
  );
}

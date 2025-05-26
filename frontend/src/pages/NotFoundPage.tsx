import { Link } from 'react-router-dom';
import { HiOutlineExclamation, HiOutlineArrowLeft } from 'react-icons/hi';

/**
 * 404 Not Found ページ
 */
export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-aws-paper-light mb-6">
        <HiOutlineExclamation className="h-12 w-12 text-aws-sea-blue-light" />
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
        <HiOutlineArrowLeft className="h-5 w-5 mr-2" />
        ホームに戻る
      </Link>
    </div>
  );
}

/**
 * 審査ページ（空の状態）
 */
export default function ReviewPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-aws-squid-ink-light">審査</h1>
        <p className="text-aws-font-color-gray mt-2">
          アップロードされた書類の審査を行います
        </p>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-10 text-center border border-light-gray">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-aws-paper-light mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-aws-sea-blue-light"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-aws-squid-ink-light mb-3">審査機能は準備中です</h2>
        <p className="text-aws-font-color-gray max-w-md mx-auto">
          この機能は現在開発中です。もうしばらくお待ちください。
        </p>
        <button className="mt-6 bg-aws-sea-blue-light hover:bg-aws-sea-blue-hover-light text-aws-font-color-white-light px-5 py-2.5 rounded-md inline-flex items-center transition-colors shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          ファイルをアップロード
        </button>
      </div>
    </div>
  );
}

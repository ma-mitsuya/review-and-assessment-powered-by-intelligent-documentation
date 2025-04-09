import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * サイドバーコンポーネント
 * レスポンシブ対応のサイドナビゲーション
 */
export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // 現在のパスに基づいてアクティブなメニュー項目を判定
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  // サイドバーの開閉を切り替える
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* モバイル用のハンバーガーメニュー */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-aws-squid-ink-light text-aws-font-color-white-light p-2 rounded-md"
        onClick={toggleSidebar}
        aria-label="メニュー"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* サイドバー */}
      <div
        className={`fixed top-0 left-0 h-full bg-aws-squid-ink-light text-aws-font-color-white-light w-64 transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center mb-8">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 mr-3 text-aws-aqua" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <h1 className="text-2xl font-bold">BEACON</h1>
          </div>
          
          <nav>
            <ul className="space-y-2">
              <li className="mb-1">
                <Link
                  to="/checklist"
                  className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                    isActive('/checklist')
                      ? 'bg-aws-sea-blue-light text-aws-font-color-white-light'
                      : 'text-aws-font-color-white-light hover:bg-aws-sea-blue-hover-light'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-3" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                  </svg>
                  チェックリスト
                </Link>
              </li>
              <li className="mb-1">
                <Link
                  to="/review"
                  className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                    isActive('/review')
                      ? 'bg-aws-sea-blue-light text-aws-font-color-white-light'
                      : 'text-aws-font-color-white-light hover:bg-aws-sea-blue-hover-light'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-3" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M16 13H8" />
                    <path d="M16 17H8" />
                    <path d="M10 9H8" />
                  </svg>
                  審査
                </Link>
              </li>
              <li className="mb-1">
                <Link
                  to="/documents"
                  className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                    isActive('/documents')
                      ? 'bg-aws-sea-blue-light text-aws-font-color-white-light'
                      : 'text-aws-font-color-white-light hover:bg-aws-sea-blue-hover-light'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-3" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M20 11.08V8l-6-6H6a2 2 0 00-2 2v16c0 1.1.9 2 2 2h6" />
                    <path d="M14 3v5h5" />
                    <circle cx="16" cy="16" r="6" />
                    <path d="M16 14v4" />
                    <path d="M16 20h.01" />
                  </svg>
                  ドキュメント
                </Link>
              </li>
            </ul>
          </nav>
          
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center text-sm text-aws-font-color-white-light opacity-75">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 mr-2" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
              v1.0.0
            </div>
          </div>
        </div>
      </div>

      {/* モバイル表示時のオーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
}

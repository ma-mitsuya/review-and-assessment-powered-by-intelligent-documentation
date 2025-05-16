import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import iconImage from "../assets/icon.png";
import {
  HiX,
  HiMenu,
  HiCheck,
  HiDocumentText,
  HiInformationCircle,
  HiLogout,
  HiUser,
} from "react-icons/hi";
import { useAuth } from "../contexts/AuthContext";

/**
 * サイドバーコンポーネント
 * レスポンシブ対応のサイドナビゲーション
 */
export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();

  // 現在のパスに基づいてアクティブなメニュー項目を判定
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  // サイドバーの開閉を切り替える
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // ログアウト処理
  const handleLogout = async () => {
    await signOut();
  };

  return (
    <>
      {/* モバイル用のハンバーガーメニュー */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-aws-squid-ink-light text-aws-font-color-white-light p-2 rounded-md"
        onClick={toggleSidebar}
        aria-label="メニュー"
      >
        {isOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
      </button>

      {/* サイドバー */}
      <div
        className={`fixed top-0 left-0 h-full bg-aws-squid-ink-light text-aws-font-color-white-light w-64 transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6">
          <div className="flex items-center mb-8">
            <img src={iconImage} alt="RAPID Logo" className="h-16 w-16 mr-3" />
            <h1 className="text-2xl font-bold">RAPID</h1>
          </div>

          <nav>
            <ul className="space-y-2">
              <li className="mb-1">
                <Link
                  to="/checklist"
                  className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                    isActive("/checklist")
                      ? "bg-aws-sea-blue-light text-aws-font-color-white-light"
                      : "text-aws-font-color-white-light hover:bg-aws-sea-blue-hover-light"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <HiCheck className="h-5 w-5 mr-3" />
                  チェックリスト
                </Link>
              </li>
              <li className="mb-1">
                <Link
                  to="/review"
                  className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                    isActive("/review")
                      ? "bg-aws-sea-blue-light text-aws-font-color-white-light"
                      : "text-aws-font-color-white-light hover:bg-aws-sea-blue-hover-light"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <HiDocumentText className="h-5 w-5 mr-3" />
                  審査
                </Link>
              </li>
            </ul>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            {/* ユーザーメニュー */}
            {user && (
              <div className="mb-4 border-t border-aws-font-color-white-light border-opacity-20 pt-4">
                <div className="flex items-center mb-2">
                  <HiUser className="h-5 w-5 mr-2" />
                  <span className="text-sm truncate">
                    {user.username || user.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm rounded-md hover:bg-aws-sea-blue-hover-light transition-colors"
                >
                  <HiLogout className="h-4 w-4 mr-2" />
                  ログアウト
                </button>
              </div>
            )}
            <div className="flex items-center text-sm text-aws-font-color-white-light opacity-75">
              <HiInformationCircle className="h-4 w-4 mr-2" />
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

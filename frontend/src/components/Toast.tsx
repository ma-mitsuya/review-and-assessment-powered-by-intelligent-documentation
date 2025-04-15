import React, { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: (id: string) => void;
}

/**
 * トースト通知コンポーネント
 * フェードイン・フェードアウトアニメーションを備えた通知を表示します
 */
export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type = "info",
  duration = 1500,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // トーストのスタイル
  const toastStyles = {
    success: "bg-aws-lab text-aws-squid-ink-light border-l-4 border-green-700",
    error: "bg-light-red text-red border-l-4 border-red",
    warning: "bg-light-yellow text-yellow border-l-4 border-yellow",
    info: "bg-aws-mist text-aws-sea-blue-light border-l-4 border-aws-sea-blue-light",
  };

  // アイコン
  const icons = {
    success: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
    error: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
    warning: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    info: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  // マウント時にフェードイン
  useEffect(() => {
    setIsVisible(true);

    // 指定時間後に閉じる
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  // 閉じる処理
  const handleClose = () => {
    setIsLeaving(true);
    // アニメーション完了後に実際に削除
    setTimeout(() => {
      if (onClose) {
        onClose(id);
      }
    }, 300); // CSSアニメーションの時間と合わせる
  };

  return (
    <div
      className={`
        flex items-center p-4 mb-3 rounded-md shadow-lg max-w-sm w-80
        transform transition-all duration-300 ease-in-out
        ${toastStyles[type]}
        ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}
        ${isLeaving ? "translate-y-2 opacity-0" : ""}
      `}
      role="alert"
    >
      <div className="mr-3 flex-shrink-0">{icons[type]}</div>
      <div className="text-sm font-medium">{message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 hover:bg-black/10 focus:outline-none"
        onClick={handleClose}
        aria-label="閉じる"
      >
        <svg
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          ></path>
        </svg>
      </button>
    </div>
  );
};

export default Toast;

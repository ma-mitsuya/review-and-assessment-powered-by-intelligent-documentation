import React, { ReactNode, ButtonHTMLAttributes } from 'react';
import { Link, LinkProps } from 'react-router-dom';

// ボタンのバリエーション
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'text';

// ボタンのサイズ
export type ButtonSize = 'sm' | 'md' | 'lg';

// 共通のプロパティ
export interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  className?: string;
}

// 通常のボタンのプロパティ
export interface ButtonProps extends BaseButtonProps {
  children: ReactNode;
  to?: never;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  [key: string]: any; // その他のボタン属性
}

// リンクボタンのプロパティ
export interface LinkButtonProps extends BaseButtonProps {
  children: ReactNode;
  to: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  [key: string]: any; // その他のリンク属性
}

// プロパティの型を判定
export type CombinedButtonProps = ButtonProps | LinkButtonProps;

// リンクかどうかを判定する関数
const isLinkButton = (props: CombinedButtonProps): props is LinkButtonProps => {
  return 'to' in props && typeof props.to === 'string';
};

/**
 * 共通のボタンコンポーネント
 * 
 * @example
 * // 通常のボタン
 * <Button variant="primary" onClick={handleClick}>クリック</Button>
 * 
 * // リンクボタン
 * <Button variant="primary" to="/path">リンク</Button>
 * 
 * // アイコン付きボタン
 * <Button variant="primary" icon={<PlusIcon />}>新規作成</Button>
 */
export const Button = (props: CombinedButtonProps) => {
  const {
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    fullWidth = false,
    children,
    className = '',
    ...rest
  } = props;

  // バリアントに応じたスタイルを定義
  const variantStyles = {
    primary: 'bg-aws-sea-blue-light hover:bg-aws-sea-blue-hover-light dark:bg-aws-sea-blue-dark dark:hover:bg-aws-sea-blue-hover-dark text-aws-font-color-white-light',
    secondary: 'bg-aws-aqua hover:bg-aws-sea-blue-light text-aws-font-color-white-light',
    outline: 'bg-transparent border border-aws-sea-blue-light hover:bg-aws-paper-light text-aws-sea-blue-light dark:border-aws-sea-blue-dark dark:text-aws-font-color-dark',
    danger: 'bg-red hover:bg-red/90 text-aws-font-color-white-light',
    text: 'bg-transparent hover:bg-aws-paper-light text-aws-font-color-blue',
  };

  // サイズに応じたスタイルを定義
  const sizeStyles = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  // 共通のスタイル
  const baseStyles = 'rounded-md flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-aws-sea-blue-light focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // 幅のスタイル
  const widthStyle = fullWidth ? 'w-full' : '';

  // 最終的なクラス名
  const buttonClasses = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`;

  // アイコンの配置
  const renderContent = () => {
    if (!icon) return children;

    return (
      <>
        {iconPosition === 'left' && <span className="mr-1">{icon}</span>}
        {children}
        {iconPosition === 'right' && <span className="ml-1">{icon}</span>}
      </>
    );
  };

  // リンクボタンかどうかで出力を分ける
  if (isLinkButton(props)) {
    const { to, icon, iconPosition, variant, size, fullWidth, ...linkRest } = props;
    return (
      <Link to={to} className={buttonClasses} {...linkRest}>
        {renderContent()}
      </Link>
    );
  }

  // 不要なpropsをrestから除外
  const { icon: _, iconPosition: __, variant: ___, size: ____, fullWidth: _____, ...buttonRest } = rest;
  
  return (
    <button className={buttonClasses} {...buttonRest}>
      {renderContent()}
    </button>
  );
};

export default Button;

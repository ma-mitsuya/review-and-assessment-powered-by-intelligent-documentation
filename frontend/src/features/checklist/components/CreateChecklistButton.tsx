import React from 'react';
import { Button, LinkButtonProps } from '../../../components/Button';

/**
 * チェックリスト新規作成ボタンコンポーネント
 * 共通のButtonコンポーネントを継承し、チェックリスト新規作成用のスタイルと機能を提供します
 */
export interface CreateChecklistButtonProps extends Omit<LinkButtonProps, 'children'> {
  children?: React.ReactNode;
}

export const CreateChecklistButton: React.FC<CreateChecklistButtonProps> = ({
  variant = 'primary',
  size = 'md',
  to = '/checklist/new',
  children = '新規作成',
  ...rest
}) => {
  // プラスアイコン
  const plusIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
  );

  return (
    <Button
      variant={variant}
      size={size}
      to={to}
      icon={plusIcon}
      iconPosition="left"
      {...rest}
    >
      {children}
    </Button>
  );
};

export default CreateChecklistButton;

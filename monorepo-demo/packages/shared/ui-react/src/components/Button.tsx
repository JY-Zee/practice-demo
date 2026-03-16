import React from 'react';
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';
import classNames from 'classnames';

export interface ButtonProps extends AntButtonProps {
  /** 是否为全宽按钮 */
  fullWidth?: boolean;
}

/**
 * Button 组件 - 基于 Ant Design 封装
 */
export const Button: React.FC<ButtonProps> = ({
  fullWidth,
  className,
  ...props
}) => {
  const btnClassName = classNames(className, {
    'w-full': fullWidth,
  });

  return <AntButton className={btnClassName} {...props} />;
};

Button.displayName = 'Button';

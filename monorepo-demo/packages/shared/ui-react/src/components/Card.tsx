import React from 'react';
import AntCard from 'antd/es/card';
import type { CardProps as AntCardProps } from 'antd/es/card';
import classNames from 'classnames';

export interface CardProps extends AntCardProps {
  /** 是否显示阴影 */
  shadow?: boolean;
}

/**
 * Card 组件 - 基于 Ant Design 封装
 */
export const Card: React.FC<CardProps> = ({
  shadow = true,
  hoverable = false,
  className,
  children,
  ...props
}) => {
  const cardClassName = classNames(className, {
    'shadow-md': shadow,
  });

  return (
    <AntCard hoverable={hoverable} className={cardClassName} {...props}>
      {children}
    </AntCard>
  );
};

Card.displayName = 'Card';

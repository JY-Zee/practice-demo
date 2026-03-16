import React from 'react';
import { Input as AntInput, InputProps as AntInputProps } from 'antd';

export interface InputProps extends AntInputProps {
  /** 输入框标签 */
  label?: string;
  /** 是否必填 */
  required?: boolean;
}

/**
 * Input 组件 - 基于 Ant Design 封装
 */
export const Input: React.FC<InputProps> = ({ label, required, ...props }) => {
  if (!label) {
    return <AntInput {...props} />;
  }

  return (
    <div className="input-wrapper">
      <label className="input-label">
        {required && <span className="text-red-500">* </span>}
        {label}
      </label>
      <AntInput {...props} />
    </div>
  );
};

Input.displayName = 'Input';

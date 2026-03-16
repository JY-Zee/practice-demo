/**
 * 验证手机号
 * @param phone - 手机号
 * @returns 是否有效
 */
export const isValidPhone = (phone: string): boolean => {
  return /^1[3-9]\d{9}$/.test(phone);
};

/**
 * 验证邮箱
 * @param email - 邮箱
 * @returns 是否有效
 */
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * 验证身份证号
 * @param idCard - 身份证号
 * @returns 是否有效
 */
export const isValidIdCard = (idCard: string): boolean => {
  return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard);
};

/**
 * 验证 URL
 * @param url - URL 地址
 * @returns 是否有效
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 验证密码强度
 * @param password - 密码
 * @returns 强度等级(0-3): 0-弱, 1-中, 2-强, 3-很强
 */
export const getPasswordStrength = (password: string): number => {
  if (!password) return 0;

  let strength = 0;

  // 长度检查
  if (password.length >= 8) strength++;

  // 包含数字
  if (/\d/.test(password)) strength++;

  // 包含小写字母
  if (/[a-z]/.test(password)) strength++;

  // 包含大写字母
  if (/[A-Z]/.test(password)) strength++;

  // 包含特殊字符
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  // 归一化到 0-3
  return Math.min(3, Math.floor(strength / 2));
};

/**
 * 验证是否为数字
 * @param value - 值
 * @returns 是否为数字
 */
export const isNumber = (value: any): boolean => {
  return typeof value === 'number' && !Number.isNaN(value);
};

/**
 * 验证是否为空(null, undefined, '', [], {})
 * @param value - 值
 * @returns 是否为空
 */
export const isEmpty = (value: any): boolean => {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

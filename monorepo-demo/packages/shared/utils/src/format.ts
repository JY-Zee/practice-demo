/**
 * 格式化金额(千分位)
 * @param amount - 金额
 * @param decimals - 小数位数(默认 2)
 * @returns 格式化后的金额字符串
 */
export const formatMoney = (
  amount: number | string | null | undefined,
  decimals = 2
): string => {
  if (amount == null || amount === '') return '-';

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) return '-';

  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * 格式化文件大小
 * @param bytes - 字节数
 * @returns 格式化后的文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * 格式化百分比
 * @param value - 数值(0-100 或 0-1)
 * @param isDecimal - 是否是小数形式(默认 false)
 * @returns 格式化后的百分比字符串
 */
export const formatPercent = (
  value: number | null | undefined,
  isDecimal = false
): string => {
  if (value == null) return '-';

  const percent = isDecimal ? value * 100 : value;
  return `${percent.toFixed(2)}%`;
};

/**
 * 格式化手机号(中间四位用 * 替代)
 * @param phone - 手机号
 * @returns 格式化后的手机号
 */
export const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return '-';

  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

/**
 * 截断字符串
 * @param str - 字符串
 * @param maxLength - 最大长度
 * @param suffix - 后缀(默认 '...')
 * @returns 截断后的字符串
 */
export const truncate = (
  str: string | null | undefined,
  maxLength: number,
  suffix = '...'
): string => {
  if (!str) return '-';
  if (str.length <= maxLength) return str;

  return str.slice(0, maxLength) + suffix;
};

/**
 * 首字母大写
 * @param str - 字符串
 * @returns 首字母大写的字符串
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

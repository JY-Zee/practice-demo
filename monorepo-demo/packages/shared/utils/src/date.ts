import dayjs, { Dayjs, ConfigType } from 'dayjs';
import 'dayjs/locale/zh-cn';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

// 扩展 dayjs 插件
dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.locale('zh-cn');

/**
 * 格式化日期
 * @param date - 日期
 * @param format - 格式(默认: YYYY-MM-DD HH:mm:ss)
 * @returns 格式化后的日期字符串
 */
export const formatDate = (
  date: ConfigType,
  format = 'YYYY-MM-DD HH:mm:ss'
): string => {
  return date ? dayjs(date).format(format) : '-';
};

/**
 * 格式化为相对时间
 * @param date - 日期
 * @returns 相对时间字符串(如:3 小时前)
 */
export const formatRelativeTime = (date: ConfigType): string => {
  return date ? dayjs(date).fromNow() : '-';
};

/**
 * 获取日期范围
 * @param days - 天数(默认 7 天)
 * @returns [开始日期, 结束日期]
 */
export const getDateRange = (days = 7): [Dayjs, Dayjs] => {
  const end = dayjs();
  const start = end.subtract(days, 'day');
  return [start, end];
};

/**
 * 判断日期是否在范围内
 * @param date - 待判断的日期
 * @param start - 开始日期
 * @param end - 结束日期
 * @returns 是否在范围内
 */
export const isDateInRange = (
  date: ConfigType,
  start: ConfigType,
  end: ConfigType
): boolean => {
  const targetDate = dayjs(date);
  return (
    targetDate.isSameOrAfter(start, 'day') &&
    targetDate.isSameOrBefore(end, 'day')
  );
};

/**
 * 获取今天的日期范围
 * @returns [今天开始, 今天结束]
 */
export const getTodayRange = (): [Dayjs, Dayjs] => {
  return [dayjs().startOf('day'), dayjs().endOf('day')];
};

// 导出 dayjs 实例供直接使用
export { dayjs };

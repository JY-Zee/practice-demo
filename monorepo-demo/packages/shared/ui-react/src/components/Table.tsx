import { Table as AntTable, TableProps as AntTableProps } from 'antd';
import type { PaginationResponse } from '@demo/types';

export interface TableProps<T = any> extends Omit<AntTableProps<T>, 'dataSource'> {
  /** 数据源(支持分页响应) */
  dataSource?: T[] | PaginationResponse<T>;
  /** 是否显示分页 */
  showPagination?: boolean;
}

/**
 * Table 组件 - 基于 Ant Design 封装,支持分页响应数据
 */
export function Table<T extends Record<string, any>>({
  dataSource,
  showPagination = true,
  pagination,
  ...props
}: TableProps<T>) {
  // 判断是否为分页响应数据
  const isPaginationResponse = (
    data: any
  ): data is PaginationResponse<T> => {
    return data && 'list' in data && 'total' in data;
  };

  const actualDataSource = isPaginationResponse(dataSource)
    ? dataSource.list
    : dataSource;

  const actualPagination = showPagination
    ? isPaginationResponse(dataSource)
      ? {
          current: dataSource.page,
          pageSize: dataSource.pageSize,
          total: dataSource.total,
          ...pagination,
        }
      : pagination
    : false;

  return (
    <AntTable<T>
      dataSource={actualDataSource}
      pagination={actualPagination}
      {...props}
    />
  );
}

Table.displayName = 'Table';

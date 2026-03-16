/**
 * ID 类型
 */
export type ID = string | number;

/**
 * 可选类型
 */
export type Nullable<T> = T | null;

/**
 * 键值对
 */
export type KeyValue<T = any> = Record<string, T>;

/**
 * 选项类型
 */
export interface Option<T = any> {
  /** 标签 */
  label: string;
  /** 值 */
  value: T;
  /** 是否禁用 */
  disabled?: boolean;
  /** 子选项 */
  children?: Option<T>[];
}

/**
 * 树形节点
 */
export interface TreeNode<T = any> {
  /** 节点 ID */
  id: ID;
  /** 节点名称 */
  name: string;
  /** 父节点 ID */
  parentId?: ID;
  /** 子节点 */
  children?: TreeNode<T>[];
  /** 节点数据 */
  data?: T;
}

/**
 * 时间戳类型
 */
export type Timestamp = number | string | Date;

/**
 * 坐标
 */
export interface Coordinate {
  /** 经度 */
  lng: number;
  /** 纬度 */
  lat: number;
}

/**
 * 地址信息
 */
export interface Address {
  /** 省份 */
  province: string;
  /** 城市 */
  city: string;
  /** 区县 */
  district: string;
  /** 详细地址 */
  detail: string;
  /** 邮编 */
  zipCode?: string;
  /** 坐标 */
  coordinate?: Coordinate;
}

/**
 * 文件信息
 */
export interface FileInfo {
  /** 文件 ID */
  id: string;
  /** 文件名 */
  name: string;
  /** 文件 URL */
  url: string;
  /** 文件大小(字节) */
  size: number;
  /** 文件类型 */
  type: string;
  /** 扩展名 */
  extension: string;
  /** 上传时间 */
  uploadedAt: string;
}

/**
 * 操作状态
 */
export enum OperationStatus {
  /** 成功 */
  Success = 'success',
  /** 失败 */
  Failed = 'failed',
  /** 进行中 */
  Processing = 'processing',
  /** 待处理 */
  Pending = 'pending',
  /** 已取消 */
  Cancelled = 'cancelled',
}

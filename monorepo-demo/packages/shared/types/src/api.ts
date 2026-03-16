/**
 * API 响应基础结构
 */
export interface ApiResponse<T = any> {
  /** 状态码 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 响应数据 */
  data: T;
  /** 时间戳 */
  timestamp?: number;
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  pageSize: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页响应数据
 */
export interface PaginationResponse<T = any> {
  /** 数据列表 */
  list: T[];
  /** 总条数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrev: boolean;
}

/**
 * 列表查询参数
 */
export interface ListParams extends Partial<PaginationParams> {
  /** 搜索关键词 */
  keyword?: string;
  /** 筛选条件 */
  filters?: Record<string, any>;
}

/**
 * 上传文件响应
 */
export interface UploadResponse {
  /** 文件 ID */
  id: string;
  /** 文件名 */
  filename: string;
  /** 文件 URL */
  url: string;
  /** 文件大小(字节) */
  size: number;
  /** 文件类型 */
  mimeType: string;
  /** 上传时间 */
  uploadedAt: string;
}

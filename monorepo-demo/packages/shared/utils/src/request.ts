import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';

/**
 * API 响应结构
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/**
 * 请求配置扩展
 */
export interface RequestConfig extends AxiosRequestConfig {
  skipErrorHandler?: boolean; // 跳过错误处理
  showLoading?: boolean; // 显示 loading
}

/**
 * 创建 axios 实例
 */
const createAxiosInstance = (config?: AxiosRequestConfig): AxiosInstance => {
  const instance = axios.create({
    baseURL: (import.meta as any).env?.VITE_API_BASE_URL || '/api',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
    ...config,
  });

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      // 添加 token
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const { code, message, data } = response.data;

      // 成功响应
      if (code === 200 || code === 0) {
        return data;
      }

      // 业务错误
      const error = new Error(message || '请求失败') as AxiosError;
      return Promise.reject(error);
    },
    (error: AxiosError) => {
      const { response } = error;

      // 处理 HTTP 错误
      if (response) {
        const { status } = response;

        switch (status) {
          case 401:
            // 未授权,清除 token 并跳转登录
            localStorage.removeItem('token');
            window.location.href = '/login';
            break;
          case 403:
            console.error('没有权限访问');
            break;
          case 404:
            console.error('请求的资源不存在');
            break;
          case 500:
            console.error('服务器错误');
            break;
          default:
            console.error(`请求错误: ${status}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        console.error('请求超时');
      } else if (error.message === 'Network Error') {
        console.error('网络错误');
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

/**
 * 默认请求实例
 */
const request = createAxiosInstance();

/**
 * GET 请求
 */
export const get = <T = any>(
  url: string,
  config?: RequestConfig
): Promise<T> => {
  return request.get(url, config);
};

/**
 * POST 请求
 */
export const post = <T = any>(
  url: string,
  data?: any,
  config?: RequestConfig
): Promise<T> => {
  return request.post(url, data, config);
};

/**
 * PUT 请求
 */
export const put = <T = any>(
  url: string,
  data?: any,
  config?: RequestConfig
): Promise<T> => {
  return request.put(url, data, config);
};

/**
 * DELETE 请求
 */
export const del = <T = any>(
  url: string,
  config?: RequestConfig
): Promise<T> => {
  return request.delete(url, config);
};

/**
 * 导出实例和创建函数
 */
export { request, createAxiosInstance };
export default request;

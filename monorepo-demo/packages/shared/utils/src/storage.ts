/**
 * localStorage 封装
 */
export const storage = {
  /**
   * 设置存储
   * @param key - 键
   * @param value - 值
   */
  set(key: string, value: any): void {
    try {
      const data = JSON.stringify(value);
      localStorage.setItem(key, data);
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },

  /**
   * 获取存储
   * @param key - 键
   * @returns 值
   */
  get<T = any>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  /**
   * 删除存储
   * @param key - 键
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },

  /**
   * 清空存储
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  },

  /**
   * 检查键是否存在
   * @param key - 键
   * @returns 是否存在
   */
  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  },
};

/**
 * sessionStorage 封装
 */
export const sessionStorage = {
  /**
   * 设置存储
   * @param key - 键
   * @param value - 值
   */
  set(key: string, value: any): void {
    try {
      const data = JSON.stringify(value);
      window.sessionStorage.setItem(key, data);
    } catch (error) {
      console.error('SessionStorage set error:', error);
    }
  },

  /**
   * 获取存储
   * @param key - 键
   * @returns 值
   */
  get<T = any>(key: string): T | null {
    try {
      const data = window.sessionStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('SessionStorage get error:', error);
      return null;
    }
  },

  /**
   * 删除存储
   * @param key - 键
   */
  remove(key: string): void {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.error('SessionStorage remove error:', error);
    }
  },

  /**
   * 清空存储
   */
  clear(): void {
    try {
      window.sessionStorage.clear();
    } catch (error) {
      console.error('SessionStorage clear error:', error);
    }
  },

  /**
   * 检查键是否存在
   * @param key - 键
   * @returns 是否存在
   */
  has(key: string): boolean {
    return window.sessionStorage.getItem(key) !== null;
  },
};

/**
 * 用户性别
 */
export enum Gender {
  /** 男 */
  Male = 1,
  /** 女 */
  Female = 2,
  /** 未知 */
  Unknown = 0,
}

/**
 * 用户状态
 */
export enum UserStatus {
  /** 正常 */
  Active = 1,
  /** 禁用 */
  Disabled = 0,
  /** 已删除 */
  Deleted = -1,
}

/**
 * 用户角色
 */
export enum UserRole {
  /** 超级管理员 */
  SuperAdmin = 'super_admin',
  /** 管理员 */
  Admin = 'admin',
  /** 普通用户 */
  User = 'user',
  /** 访客 */
  Guest = 'guest',
}

/**
 * 用户信息
 */
export interface User {
  /** 用户 ID */
  id: string;
  /** 用户名 */
  username: string;
  /** 昵称 */
  nickname: string;
  /** 邮箱 */
  email: string;
  /** 手机号 */
  phone?: string;
  /** 头像 URL */
  avatar?: string;
  /** 性别 */
  gender: Gender;
  /** 状态 */
  status: UserStatus;
  /** 角色 */
  roles: UserRole[];
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 最后登录时间 */
  lastLoginAt?: string;
}

/**
 * 用户登录参数
 */
export interface LoginParams {
  /** 用户名或邮箱 */
  username: string;
  /** 密码 */
  password: string;
  /** 验证码 */
  captcha?: string;
  /** 记住我 */
  remember?: boolean;
}

/**
 * 用户登录响应
 */
export interface LoginResponse {
  /** 访问令牌 */
  accessToken: string;
  /** 刷新令牌 */
  refreshToken: string;
  /** 令牌类型 */
  tokenType: string;
  /** 过期时间(秒) */
  expiresIn: number;
  /** 用户信息 */
  user: User;
}

/**
 * 用户注册参数
 */
export interface RegisterParams {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 确认密码 */
  confirmPassword: string;
  /** 邮箱 */
  email: string;
  /** 手机号 */
  phone?: string;
  /** 验证码 */
  captcha: string;
}

/**
 * 用户资料更新参数
 */
export interface UpdateProfileParams {
  /** 昵称 */
  nickname?: string;
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  phone?: string;
  /** 头像 */
  avatar?: string;
  /** 性别 */
  gender?: Gender;
}

/**
 * 修改密码参数
 */
export interface ChangePasswordParams {
  /** 旧密码 */
  oldPassword: string;
  /** 新密码 */
  newPassword: string;
  /** 确认新密码 */
  confirmPassword: string;
}

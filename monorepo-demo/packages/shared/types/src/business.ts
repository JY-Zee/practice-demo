import { ID, Status } from './common';

/**
 * 订单状态
 */
export enum OrderStatus {
  Pending = 'pending',
  Paid = 'paid',
  Shipped = 'shipped',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Refunded = 'refunded',
}

/**
 * 订单信息
 */
export interface Order {
  id: ID;
  orderNo: string;
  userId: ID;
  status: OrderStatus;
  totalAmount: number;
  paidAmount: number;
  items: OrderItem[];
  shippingAddress?: Address;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  shippedAt?: string;
  completedAt?: string;
}

/**
 * 订单项
 */
export interface OrderItem {
  id: ID;
  productId: ID;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

/**
 * 地址信息
 */
export interface Address {
  id?: ID;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  postalCode?: string;
  isDefault?: boolean;
}

/**
 * 商品信息
 */
export interface Product {
  id: ID;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  images: string[];
  categoryId: ID;
  categoryName?: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

/**
 * 商品分类
 */
export interface Category {
  id: ID;
  name: string;
  parentId?: ID;
  icon?: string;
  sort: number;
  status: Status;
  children?: Category[];
}

/**
 * 文章信息
 */
export interface Article {
  id: ID;
  title: string;
  content: string;
  summary?: string;
  coverImage?: string;
  author: string;
  authorId: ID;
  categoryId: ID;
  categoryName?: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  status: Status;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 评论信息
 */
export interface Comment {
  id: ID;
  content: string;
  userId: ID;
  userName: string;
  userAvatar?: string;
  targetId: ID;
  targetType: 'article' | 'product' | 'order';
  parentId?: ID;
  likeCount: number;
  replyCount: number;
  replies?: Comment[];
  createdAt: string;
}

/**
 * 通知信息
 */
export interface Notification {
  id: ID;
  title: string;
  content: string;
  type: NotificationType;
  userId: ID;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

/**
 * 通知类型
 */
export enum NotificationType {
  System = 'system',
  Order = 'order',
  Message = 'message',
  Promotion = 'promotion',
}

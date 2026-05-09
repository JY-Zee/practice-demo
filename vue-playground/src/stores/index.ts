/**
 * stores/index.ts — 统一出口
 * 组件只需从这里导入，无需关心内部文件路径
 */
export { useCounterStore } from './counter'
export { useUserStore } from './user'
export { useCartStore } from './cart'

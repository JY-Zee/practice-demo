# 状态管理模块

> 模块路径：`src/stores/`

## 概述

使用 Pinia 作为状态管理库，采用 **Composition API 风格**（setup 函数），而非 Options API 风格。

## 持久化

`pinia-plugin-persistedstate` 在 `main.ts` 中全局注册。每个 store 需要显式开启持久化：

```ts
export const useCounterStore = defineStore(
  'counter',
  () => { /* ... */ },
  { persist: true }  // 按需开启
)
```

默认持久化到 `localStorage`，key 为 store 的 ID（即 `defineStore` 的第一个参数）。

## 现有 Store

### `counter.ts`

- ID：`counter`
- 状态：`count`（计数器）、`doubleCount`（计算属性，`count * 2`）
- 方法：`increment()`（`count += 1`）
- 持久化：已开启

## 约定

- 新建 store 文件放在 `src/stores/` 目录，文件名与 store ID 保持一致
- 统一使用 Composition API 风格（`defineStore(id, () => { ... })`）
- 需要持久化的 store 在第三个参数传入 `{ persist: true }`

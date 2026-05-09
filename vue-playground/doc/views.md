# 页面组件模块

> 模块路径：`src/views/`

## 概述

页面级组件，由路由加载渲染。与 `src/components/`（若后续创建）的区别：views 是路由页面，components 是可复用片段。

## 现有页面

### `HomeView.vue`

首页，演示 Pinia store 与 Naive UI 组件联动：

- 使用 `NStatistic` 展示 `counter.count` 和 `counter.doubleCount`
- 使用 `NButton` 触发 `counter.increment()`
- 通过 `@/stores/counter` 引入 store

## 约定

- 文件命名：`PascalCase` + `View` 后缀（如 `HomeView.vue`、`UserListView.vue`）
- 路由组件在 `src/router/index.ts` 中注册
- Naive UI 组件按需导入（`import { NButton } from 'naive-ui'`），不使用全量导入

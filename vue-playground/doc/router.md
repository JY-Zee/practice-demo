# 路由模块

> 模块路径：`src/router/index.ts`

## 概述

使用 Vue Router 4，采用 HTML5 History 模式（`createWebHistory`），无 base 路径前缀。

## 当前路由

| 路径 | 名称 | 组件 |
|------|------|------|
| `/` | `home` | `HomeView` |

路由组件通过 `@/views` 路径别名导入，而非动态导入（`import()`）。后续新增路由时，若页面体积较大，建议改为动态导入以优化首屏加载：

```ts
component: () => import('@/views/SomeView.vue')
```

## 约定

- 页面级组件统一放在 `src/views/` 目录，文件名采用 `PascalCase` + `View` 后缀
- 路由配置集中在此单文件，未拆分模块

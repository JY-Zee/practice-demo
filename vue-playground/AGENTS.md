# vue-playground

Vue 3 + Vite + TypeScript + Pinia + Vue Router + Naive UI 脚手架项目。

**注意：本项目与父仓库 `practice-demo` 中其他项目完全独立，无共享依赖。**

## 命令

```bash
pnpm dev       # Vite 开发服务器
pnpm build     # vue-tsc -b 类型检查 → vite 构建（类型检查嵌入 build，无独立 typecheck 命令）
pnpm preview   # 预览构建产物
```

无独立 lint / typecheck / test 脚本。

## 路径别名

`@` → `src/`，需同时在 `vite.config.ts` 和 `tsconfig.app.json` 中配置，缺一不可。

## 架构要点

- 启动顺序：`createPinia → persistedstate 插件 → app.use(pinia) → app.use(router) → mount`，pinia 必须先于 router
- Naive UI：Provider 包裹在 `App.vue`（`NConfigProvider > NMessageProvider > 内容`），组件按需导入（`import { NButton } from 'naive-ui'`）
- Pinia：统一 Composition API 风格，持久化通过 `{ persist: true }` 按需开启

## 目录结构

```
src/
├── main.ts          # 入口：pinia + router 注册
├── App.vue          # 根组件：Naive UI Provider + RouterView
├── style.css        # 全局样式
├── router/index.ts  # 路由配置（createWebHistory）
├── stores/          # Pinia store（Composition API + persistedstate）
├── views/           # 路由页面组件
└── vite-env.d.ts    # Vite 类型声明
```

## 模块详解

各模块的详细说明见 `doc/` 目录：

| 文件 | 模块 |
|------|------|
| `doc/app-entry.md` | 启动流程与根组件结构 |
| `doc/router.md` | 路由配置与约定 |
| `doc/stores.md` | 状态管理与持久化 |
| `doc/views.md` | 页面组件与约定 |

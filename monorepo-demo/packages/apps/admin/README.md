# @demo/admin

Vue 3 Admin 后台管理系统 - Monorepo 架构示例

## 功能特性

- ✅ 使用 Vue 3 + TypeScript
- ✅ 基于 Vite 构建
- ✅ 使用 Vue Router 进行路由管理
- ✅ 集成 Element Plus UI 组件库
- ✅ 使用 workspace 中的共享包:
  - @demo/ui-vue - Vue UI 组件
  - @demo/utils - 工具函数
  - @demo/types - 类型定义
  - @demo/eslint-config - ESLint 配置
  - @demo/tsconfig - TypeScript 配置
  - @demo/vite-config - Vite 配置

## 开发

\`\`\`bash
# 安装依赖(在 monorepo 根目录)
pnpm install

# 启动开发服务器
pnpm --filter @demo/admin dev

# 或者在当前目录
pnpm dev
\`\`\`

## 构建

\`\`\`bash
pnpm build
\`\`\`

## 预览

\`\`\`bash
pnpm preview
\`\`\`

## 代码检查

\`\`\`bash
pnpm lint
pnpm lint:fix
pnpm type-check
\`\`\`

## 页面说明

- **Dashboard** (`/`): 数据概览和系统信息展示
- **用户管理** (`/users`): 用户列表管理,展示共享组件和工具的使用

## 与 React Web App 的对比

本项目与 `@demo/web-app` 虽然使用不同的框架(Vue vs React),但共享了:
- 类型定义 (@demo/types)
- 工具函数 (@demo/utils)
- 配置文件 (@demo/eslint-config, @demo/tsconfig, @demo/vite-config)

这展示了 Monorepo 架构在跨框架项目中的代码复用能力。

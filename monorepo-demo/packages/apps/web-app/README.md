# @demo/web-app

React Web 应用 - Monorepo 架构示例

## 功能特性

- ✅ 使用 React 18 + TypeScript
- ✅ 基于 Vite 构建
- ✅ 使用 React Router 进行路由管理
- ✅ 集成 Ant Design UI 组件库
- ✅ 使用 workspace 中的共享包:
  - @demo/ui-react - UI 组件
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
pnpm --filter @demo/web-app dev

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

- **首页** (`/`): 展示 Monorepo 架构和使用的共享包
- **用户列表** (`/users`): 展示使用共享组件和工具函数的实际场景

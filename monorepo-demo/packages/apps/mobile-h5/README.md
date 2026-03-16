# @demo/mobile-h5

React Mobile H5 应用 - Monorepo 架构示例

## 功能特性

- ✅ 使用 React 18 + TypeScript
- ✅ 基于 Vite 构建
- ✅ 使用 React Router 进行路由管理
- ✅ 集成 Vant 移动端 UI 组件库
- ✅ 响应式设计,适配移动端
- ✅ 使用 workspace 中的共享包:
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
pnpm --filter @demo/mobile-h5 dev

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

- **首页** (`/`): 展示应用信息和共享包列表
- **个人中心** (`/profile`): 用户信息展示,演示数据格式化

## 移动端调试

开发时可以通过以下方式在移动设备上调试:

1. 确保移动设备和开发机在同一网络
2. 启动开发服务器后,访问 `http://[你的IP]:3002`
3. 或使用浏览器的移动端调试工具(F12 -> 设备模拟)

## 与其他应用的对比

- **与 Web App 相比**: 使用移动端 UI 库(Vant),专门为移动端优化
- **与 Admin 相比**: 界面简洁,操作便捷,适合移动场景
- **共同点**: 共享相同的工具库、类型定义和配置,确保一致性

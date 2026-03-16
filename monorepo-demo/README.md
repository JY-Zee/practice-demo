# Monorepo 学习项目 🚀

这是一个**企业级 Monorepo 实战项目**,从零到一完整实现多包管理架构,包含 React、Vue 双框架应用,以及完善的工具链和 CI/CD 流程。

## ✨ 项目亮点

- ✅ **完整的包结构**: 3 个应用 + 5 个共享包 + 3 个配置包
- ✅ **跨框架共享**: React 和 Vue 应用共享工具库、类型定义
- ✅ **现代化工具链**: pnpm + Turborepo + Changesets
- ✅ **开箱即用**: 配置完善,克隆即可运行
- ✅ **详细文档**: 从基础到深度的完整学习路径

## 📦 项目结构

```
monorepo-demo/
├── packages/
│   ├── shared/              # 共享包
│   │   ├── utils/           # 工具函数库 (axios, dayjs)
│   │   ├── types/           # TypeScript 类型定义
│   │   ├── ui-react/        # React 组件库 (Ant Design)
│   │   └── ui-vue/          # Vue 组件库 (Element Plus)
│   ├── config/              # 配置包
│   │   ├── eslint-config/   # ESLint 规则
│   │   ├── tsconfig/        # TypeScript 配置
│   │   └── vite-config/     # Vite 配置
│   └── apps/                # 应用包
│       ├── web-app/         # React Web 应用 :3000
│       ├── admin/           # Vue Admin 后台 :3001
│       └── mobile-h5/       # React Mobile H5 :3002
├── docs/                    # 学习文档 📚
│   ├── 01-基础篇.md         # pnpm workspace 入门
│   ├── 02-进阶篇.md         # Turborepo + Changesets
│   └── 03-深度篇.md         # CI/CD + 性能优化
├── .github/workflows/       # GitHub Actions
├── .vscode/                 # VSCode 配置
├── pnpm-workspace.yaml      # workspace 配置
├── turbo.json               # Turborepo 配置
├── DEVELOPMENT.md           # 开发指南
└── package.json             # 根配置
```

## 🚀 快速开始

### 前置要求

```bash
Node.js >= 18.0.0
pnpm >= 8.0.0
```

### 一键启动

```bash
# 1. 安装依赖
pnpm install

# 2. 构建共享包
pnpm build

# 3. 启动应用
pnpm dev        # 启动所有应用
pnpm dev:web    # React Web (http://localhost:3000)
pnpm dev:admin  # Vue Admin (http://localhost:3001)
pnpm dev:mobile # Mobile H5 (http://localhost:3002)
```

### 项目演示

启动后可以看到:

- **Web 应用**: 展示共享包使用、数据格式化、组件库
- **Admin 后台**: Vue 3 管理后台,用户管理功能
- **Mobile H5**: 移动端 H5 页面,个人中心

## 📚 核心概念

### 1. pnpm workspace

pnpm workspace 允许你在一个仓库中管理多个包,它们可以相互依赖。

**优势**:
- ⚡ 快速:只安装一次依赖,多个包共享
- 💾 节省空间:通过硬链接共享依赖
- 🔒 安全:严格的依赖隔离,防止幽灵依赖

### 2. 包命名规范

使用 `@scope/package-name` 格式:
- `@demo/utils` - 工具库
- `@demo/ui-react` - React 组件库
- `@demo/web-app` - Web 应用

### 3. workspace 协议

在 `package.json` 中引用本地包:

```json
{
  "dependencies": {
    "@demo/utils": "workspace:*"
  }
}
```

## 🛠️ 常用命令

```bash
# 为特定包添加依赖
pnpm --filter @demo/web-app add react

# 为所有包添加开发依赖
pnpm -r add -D typescript

# 运行特定包的脚本
pnpm --filter @demo/utils build

# 清理所有构建产物
pnpm clean:dist

# 代码检查
pnpm lint
pnpm lint:fix

# 类型检查
pnpm type-check
```

## 📖 学习文档

- [基础篇](./docs/01-基础篇.md) - pnpm workspace 基础
- [进阶篇](./docs/02-进阶篇.md) - 构建优化与版本管理
- [深度篇](./docs/03-深度篇.md) - 性能优化与 CI/CD

## 🎯 学习路径

1. **阶段一:基础入门**
   - 理解 workspace 概念
   - 创建和管理多个包
   - 包之间的依赖关系

2. **阶段二:进阶实践**
   - 构建真实的应用
   - 配置构建工具
   - 版本管理与发布

3. **阶段三:深度掌握**
   - 性能优化
   - CI/CD 自动化
   - 开发体验优化

## 💡 最佳实践

- ✅ 使用 `workspace:*` 协议引用本地包
- ✅ 配置 `.npmrc` 防止幽灵依赖
- ✅ 统一管理依赖版本
- ✅ 共享配置文件(ESLint, TypeScript 等)
- ✅ 使用 Changesets 管理版本
- ✅ 使用 Turborepo 优化构建

## 🔗 相关资源

- [pnpm 官方文档](https://pnpm.io/)
- [Turborepo 文档](https://turbo.build/)
- [Changesets 文档](https://github.com/changesets/changesets)

## 📝 License

MIT

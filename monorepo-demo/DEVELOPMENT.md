# Monorepo 开发指南

这是一个完整的企业级 Monorepo 项目,用于学习和实践多包管理。

## 📋 快速开始

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装

```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm build
```

### 开发

```bash
# 启动所有应用
pnpm dev

# 启动特定应用
pnpm dev:web      # React Web 应用 (http://localhost:3000)
pnpm dev:admin    # Vue Admin 后台 (http://localhost:3001)
pnpm dev:mobile   # Mobile H5 (http://localhost:3002)
```

## 📦 项目结构

```
monorepo-demo/
├── packages/
│   ├── shared/           # 共享包
│   │   ├── utils/        # 工具函数库
│   │   ├── types/        # TypeScript 类型
│   │   ├── ui-react/     # React 组件库
│   │   └── ui-vue/       # Vue 组件库
│   ├── config/           # 配置包
│   │   ├── eslint-config/
│   │   ├── tsconfig/
│   │   └── vite-config/
│   └── apps/             # 应用包
│       ├── web-app/      # React Web 应用
│       ├── admin/        # Vue Admin 后台
│       └── mobile-h5/    # React Mobile H5
├── docs/                 # 学习文档
│   ├── 01-基础篇.md
│   ├── 02-进阶篇.md
│   └── 03-深度篇.md
├── .github/              # GitHub Actions
├── .vscode/              # VSCode 配置
├── pnpm-workspace.yaml   # pnpm workspace 配置
├── turbo.json            # Turborepo 配置
└── package.json          # 根配置
```

## 🛠️ 技术栈

### 核心工具

- **pnpm**: 包管理器
- **Turborepo**: 构建系统
- **Changesets**: 版本管理

### 前端框架

- **React 18**: Web 应用和 Mobile H5
- **Vue 3**: Admin 后台
- **TypeScript**: 类型支持

### 构建工具

- **Vite**: 应用构建
- **tsup**: 库打包

### UI 组件库

- **Ant Design**: React 组件
- **Element Plus**: Vue 组件
- **Vant**: 移动端组件

## 📚 学习文档

按顺序阅读学习文档:

1. [基础篇](./docs/01-基础篇.md) - pnpm workspace、包管理、脚本命令
2. [进阶篇](./docs/02-进阶篇.md) - Turborepo、Changesets、跨框架共享
3. [深度篇](./docs/03-深度篇.md) - CI/CD、性能优化、监控调试

## 🚀 常用命令

### 开发

```bash
pnpm dev              # 启动所有应用
pnpm dev:web          # 启动 Web 应用
pnpm dev:admin        # 启动 Admin 后台
pnpm dev:mobile       # 启动 Mobile H5
```

### 构建

```bash
pnpm build            # 构建所有包
pnpm build:apps       # 只构建应用
pnpm build:libs       # 只构建共享库
```

### 代码质量

```bash
pnpm lint             # 代码检查
pnpm lint:fix         # 自动修复
pnpm type-check       # 类型检查
pnpm test             # 运行测试
```

### 清理

```bash
pnpm clean            # 清理所有构建产物
pnpm clean:dist       # 清理 dist 目录
```

### 版本管理

```bash
pnpm changeset        # 创建 changeset
pnpm changeset:version # 更新版本号
pnpm changeset:publish # 发布到 npm
```

### Turborepo

```bash
pnpm turbo build      # 使用 Turbo 构建
pnpm turbo build --force  # 跳过缓存
pnpm turbo build --graph  # 查看依赖图
```

## 🎯 核心概念

### pnpm Workspace

使用 `pnpm-workspace.yaml` 定义工作空间,实现多包管理。

**优势**:
- ⚡ 更快的安装速度
- 💾 节省磁盘空间
- 🔒 严格的依赖隔离

### Turborepo

构建系统,提供:
- 🚀 并行构建
- 💨 增量构建
- 📦 智能缓存

### Changesets

版本管理工具:
- 📝 语义化版本
- 📋 自动生成 CHANGELOG
- 🚢 批量发布

## 📖 包说明

### 共享包

| 包 | 说明 | 技术栈 |
|----|------|--------|
| `@demo/utils` | 工具函数库 | TypeScript, axios, dayjs |
| `@demo/types` | 类型定义 | TypeScript |
| `@demo/ui-react` | React 组件库 | React, Ant Design |
| `@demo/ui-vue` | Vue 组件库 | Vue 3, Element Plus |

### 配置包

| 包 | 说明 |
|----|------|
| `@demo/eslint-config` | ESLint 规则 |
| `@demo/tsconfig` | TypeScript 配置 |
| `@demo/vite-config` | Vite 配置 |

### 应用包

| 包 | 说明 | 端口 | 技术栈 |
|----|------|------|--------|
| `@demo/web-app` | Web 应用 | 3000 | React, Ant Design |
| `@demo/admin` | Admin 后台 | 3001 | Vue 3, Element Plus |
| `@demo/mobile-h5` | Mobile H5 | 3002 | React, Vant |

## 🔧 开发体验

### VSCode 配置

使用 `monorepo.code-workspace` 打开项目,获得最佳开发体验:

```bash
code monorepo.code-workspace
```

### 推荐扩展

- ESLint
- Prettier
- Volar (Vue)
- Error Lens
- GitLens

### 本地包调试

修改共享包代码会自动触发热更新:

```bash
# 终端 1: watch 模式构建工具库
cd packages/shared/utils
pnpm dev

# 终端 2: 启动应用
cd packages/apps/web-app
pnpm dev

# 修改 utils 代码 → 自动重新构建 → 应用热更新
```

## 🐛 调试技巧

### 查看依赖关系

```bash
# 查看依赖树
pnpm list --depth=2

# 查看某个包被谁依赖
pnpm why @demo/utils

# 查看 workspace 包
pnpm list --depth=0
```

### 调试构建

```bash
# 跳过 Turbo 缓存
pnpm turbo build --force

# 查看详细日志
pnpm turbo build --verbosity=2

# 生成依赖图
pnpm turbo build --graph
```

### 依赖问题

```bash
# 重新安装依赖
rm -rf node_modules
pnpm install

# 清理缓存
pnpm store prune
```

## 🎓 学习路径

1. **第一步**: 阅读 [基础篇](./docs/01-基础篇.md),理解 Monorepo 和 pnpm workspace
2. **第二步**: 阅读 [进阶篇](./docs/02-进阶篇.md),学习 Turborepo 和 Changesets
3. **第三步**: 阅读 [深度篇](./docs/03-深度篇.md),掌握 CI/CD 和性能优化
4. **实践**: 尝试添加新包、修改代码、创建 changeset
5. **扩展**: 参考文档实现自己的 Monorepo 项目

## 📝 最佳实践

### 添加新包

```bash
# 1. 在对应目录创建包
mkdir -p packages/shared/new-package

# 2. 初始化 package.json
cat > packages/shared/new-package/package.json <<EOF
{
  "name": "@demo/new-package",
  "version": "1.0.0",
  "private": true
}
EOF

# 3. 安装依赖
pnpm install
```

### 添加依赖

```bash
# 为特定包添加
pnpm --filter @demo/web-app add react-query

# 为所有包添加开发依赖
pnpm -r add -D typescript

# 在根目录添加(共享)
pnpm add -Dw eslint
```

### 提交代码

```bash
# 1. 修改代码
# 2. 创建 changeset
pnpm changeset

# 3. 提交
git add .
git commit -m "feat: add new feature"

# 4. 推送
git push
```

## 🔗 相关资源

- [pnpm 文档](https://pnpm.io/)
- [Turborepo 文档](https://turbo.build/)
- [Changesets 文档](https://github.com/changesets/changesets)
- [Vite 文档](https://vitejs.dev/)

## 📄 License

MIT

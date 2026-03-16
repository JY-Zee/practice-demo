# Turborepo 配置说明

本项目使用 Turborepo 来优化构建流程。

## 核心功能

### 1. 任务编排

Turborepo 自动分析包之间的依赖关系,按拓扑顺序执行任务:

\`\`\`json
{
  "build": {
    "dependsOn": ["^build"]  // ^ 表示依赖包必须先构建
  }
}
\`\`\`

### 2. 构建缓存

Turborepo 会缓存每个任务的输出,避免重复构建:

- **本地缓存**: 存储在 `.turbo` 目录
- **远程缓存**: 可配置 Vercel 或自建缓存服务器

### 3. 并行执行

Turborepo 自动并行执行独立的任务,提升构建速度。

## 使用方法

### 构建所有包

\`\`\`bash
# 使用 turbo 执行
pnpm turbo build

# 首次构建
# - 构建所有包
# - 缓存构建结果

# 再次构建(无变更)
# - 从缓存恢复,瞬间完成
\`\`\`

### 只构建变更的包

\`\`\`bash
# 基于 main 分支的差异
pnpm turbo build --filter=...[origin/main]

# 只构建受影响的包
pnpm turbo build --filter=@demo/utils...
\`\`\`

### 清除缓存

\`\`\`bash
# 清除本地缓存
rm -rf .turbo

# 或使用 turbo 命令
pnpm turbo clean
\`\`\`

## Pipeline 配置说明

### build

- **dependsOn**: `["^build"]` - 依赖包先构建
- **outputs**: `["dist/**"]` - 缓存 dist 目录
- **cache**: `true` - 启用缓存

### dev

- **cache**: `false` - 开发模式不缓存
- **persistent**: `true` - 持续运行

### lint

- **outputs**: `[]` - 无输出文件
- **cache**: `true` - 缓存 lint 结果

### type-check

- **outputs**: `[]` - 无输出文件
- **cache**: `true` - 缓存类型检查结果

## 性能提升

使用 Turborepo 后的构建速度提升:

- **首次构建**: 与原生 pnpm 相同
- **无变更重建**: ~100% 提升(缓存命中)
- **部分变更**: 50-80% 提升(只构建变更的包)

## 缓存策略

Turborepo 计算缓存 key 时会考虑:

1. 任务输入(源代码、配置文件)
2. 依赖包的版本
3. 环境变量
4. 全局依赖(`.env.*local` 等)

## 远程缓存(可选)

### Vercel Remote Cache

\`\`\`bash
# 登录 Vercel
pnpm turbo login

# 关联项目
pnpm turbo link

# 之后构建会自动使用远程缓存
pnpm turbo build
\`\`\`

### 自建缓存服务器

可以使用 `turborepo-remote-cache` 搭建私有缓存服务。

## 最佳实践

1. **合理配置 outputs**: 只缓存必要的产物
2. **使用 filter**: 只构建需要的包
3. **定期清理**: 清理过期的缓存
4. **CI/CD 集成**: 在 CI 中使用远程缓存

## 调试

查看任务执行详情:

\`\`\`bash
# 详细日志
pnpm turbo build --verbosity=2

# 跳过缓存(用于调试)
pnpm turbo build --force

# 查看任务图
pnpm turbo build --graph
\`\`\`

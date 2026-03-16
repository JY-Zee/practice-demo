# Changesets 版本管理说明

Changesets 是一个用于管理 Monorepo 版本和发布的工具。

## 核心概念

### 1. Changeset

Changeset 是一个描述变更的文件,包含:
- 哪些包发生了变更
- 变更的类型(major/minor/patch)
- 变更的描述

### 2. 语义化版本(Semver)

- **major**: 破坏性变更(1.0.0 -> 2.0.0)
- **minor**: 新功能,向后兼容(1.0.0 -> 1.1.0)
- **patch**: Bug 修复(1.0.0 -> 1.0.1)

## 使用流程

### 步骤 1: 开发和创建 Changeset

当你修改了代码后:

\`\`\`bash
# 创建 changeset
pnpm changeset

# 交互式选择:
# 1. 选择哪些包发生了变更
# 2. 选择版本类型(major/minor/patch)
# 3. 输入变更描述
\`\`\`

这会在 `.changeset` 目录下生成一个 markdown 文件。

### 步骤 2: 更新版本

准备发布时,运行:

\`\`\`bash
# 更新版本号和生成 CHANGELOG
pnpm changeset version

# 这会:
# 1. 更新所有相关包的 package.json 版本号
# 2. 生成或更新 CHANGELOG.md
# 3. 删除已应用的 changeset 文件
\`\`\`

### 步骤 3: 发布

\`\`\`bash
# 构建所有包
pnpm build

# 发布到 npm
pnpm changeset publish

# 推送 tag 到 git
git push --follow-tags
\`\`\`

## 示例工作流

### 场景 1: 修复了 utils 包的 bug

\`\`\`bash
# 1. 修改代码
# 2. 创建 changeset
pnpm changeset

# 选择:
# - 包: @demo/utils
# - 版本: patch
# - 描述: 修复 formatDate 函数在处理 null 时的错误

# 3. 提交代码
git add .
git commit -m "fix(utils): 修复 formatDate null 处理"

# 4. 更新版本(发布前)
pnpm changeset version

# 5. 提交版本变更
git add .
git commit -m "chore: 发布版本"

# 6. 发布
pnpm build
pnpm changeset publish
git push --follow-tags
\`\`\`

### 场景 2: 给 UI 组件库添加新组件

\`\`\`bash
# 1. 添加新组件
# 2. 创建 changeset
pnpm changeset

# 选择:
# - 包: @demo/ui-react
# - 版本: minor
# - 描述: 添加 Modal 组件

# 3. 后续步骤同上
\`\`\`

### 场景 3: 破坏性变更

\`\`\`bash
# 1. 重构 API
# 2. 创建 changeset
pnpm changeset

# 选择:
# - 包: @demo/types
# - 版本: major
# - 描述: BREAKING CHANGE: 重构 User 类型定义

# 3. 后续步骤同上
\`\`\`

## 依赖更新策略

配置文件中的 `updateInternalDependencies` 设置为 `"patch"`:

- 当一个包更新时,依赖它的包会自动更新 patch 版本
- 例如: @demo/utils 更新为 1.1.0,依赖它的 @demo/web-app 会从 1.0.0 更新到 1.0.1

## Changeset 文件示例

\`.changeset/cool-lions-jump.md\`:

\`\`\`markdown
---
"@demo/utils": patch
---

修复 formatDate 函数在处理 null 值时的错误
\`\`\`

## CHANGELOG 生成

执行 `pnpm changeset version` 后,会生成类似这样的 CHANGELOG:

\`\`\`markdown
# @demo/utils

## 1.0.1

### Patch Changes

- a1b2c3d: 修复 formatDate 函数在处理 null 值时的错误
\`\`\`

## CI/CD 集成

可以在 GitHub Actions 中自动化版本发布:

\`\`\`yaml
- name: Create Release PR
  uses: changesets/action@v1
  with:
    publish: pnpm changeset publish
  env:
    GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
    NPM_TOKEN: \${{ secrets.NPM_TOKEN }}
\`\`\`

## 最佳实践

1. **及时创建 Changeset**: 每次 PR 都应该包含 changeset
2. **清晰的描述**: 变更描述要清楚,方便用户理解
3. **合理的版本类型**: 遵循语义化版本规范
4. **批量发布**: 积累一定变更后统一发布,避免频繁发版
5. **发布前测试**: 确保所有测试通过后再发布

## 常用命令

\`\`\`bash
# 创建 changeset
pnpm changeset

# 查看将要发布的版本
pnpm changeset status

# 更新版本
pnpm changeset version

# 发布
pnpm changeset publish

# 添加 changeset(不交互)
pnpm changeset add --empty
\`\`\`

## 配置说明

\`.changeset/config.json\`:

- **changelog**: CHANGELOG 生成器
- **commit**: 是否自动提交
- **fixed**: 固定一起发布的包组
- **linked**: 关联版本的包组
- **access**: npm 访问级别
- **baseBranch**: 基础分支
- **updateInternalDependencies**: 内部依赖更新策略

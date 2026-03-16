# @demo/eslint-config

共享的 ESLint 配置包。

## 使用方法

### 1. 安装

在你的项目中:

\`\`\`bash
pnpm add -D @demo/eslint-config eslint
\`\`\`

### 2. 配置

在项目根目录创建 `.eslintrc.js`:

#### React 项目

\`\`\`js
module.exports = {
  extends: ['@demo/eslint-config/react'],
  // 自定义规则
};
\`\`\`

#### Vue 项目

\`\`\`js
module.exports = {
  extends: ['@demo/eslint-config/vue'],
  // 自定义规则
};
\`\`\`

#### 通用 TypeScript 项目

\`\`\`js
module.exports = {
  extends: ['@demo/eslint-config'],
  // 自定义规则
};
\`\`\`

## 包含的规则

- ✅ TypeScript 最佳实践
- ✅ Import 排序和去重
- ✅ React Hooks 规则
- ✅ Vue 3 推荐规则
- ✅ 可访问性检查(jsx-a11y)

## 自定义规则

如果需要覆盖某些规则,在项目的 `.eslintrc.js` 中添加:

\`\`\`js
module.exports = {
  extends: ['@demo/eslint-config/react'],
  rules: {
    'no-console': 'off', // 允许 console
  },
};
\`\`\`

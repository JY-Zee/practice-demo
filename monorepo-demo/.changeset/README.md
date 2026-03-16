# Changesets

这个目录用于管理版本变更和 CHANGELOG。

## 工作流程

1. **创建 changeset**: 当你修改了某个包的代码后,运行 `pnpm changeset` 创建一个变更集
2. **更新版本**: 运行 `pnpm changeset version` 更新包版本和生成 CHANGELOG
3. **发布**: 运行 `pnpm changeset publish` 发布到 npm(或私有源)

## 更多信息

查看 [Changesets 文档](https://github.com/changesets/changesets) 了解详细用法。

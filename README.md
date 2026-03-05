# practice-demo

学习中各类 Demo 与实现记录仓库，包含前端工程化、AST、插件开发等实践内容。

## Demo 索引

### 1) AST 语法树

- AST 抽象语法树原理记录：[AST语法树原理说明](https://github.com/JY-Zee/practice-demo/blob/main/AST%E8%AF%AD%E6%B3%95%E6%A0%91/AST%E8%AF%AD%E6%B3%95%E6%A0%91%E5%8E%9F%E7%90%86%E8%AF%B4%E6%98%8E.md)
- AST Demo 实现说明：[AST语法树Demo实现说明](https://github.com/JY-Zee/practice-demo/blob/main/AST%E8%AF%AD%E6%B3%95%E6%A0%91/AST%E8%AF%AD%E6%B3%95%E6%A0%91Demo%E5%AE%9E%E7%8E%B0%E8%AF%B4%E6%98%8E.md)

### 2) Vite 插件：DOM 节点添加代码位置信息

- 目录：`vite插件-dom节点添加代码信息`
- 说明文档：[vite-plugin-vue-data-src 学习示例](https://github.com/JY-Zee/practice-demo/blob/main/vite%E6%8F%92%E4%BB%B6-dom%E8%8A%82%E7%82%B9%E6%B7%BB%E5%8A%A0%E4%BB%A3%E7%A0%81%E4%BF%A1%E6%81%AF/README.md)
- 核心目标：在开发模式下，为 `.vue` 模板元素自动注入 `data-src="相对路径:行号"`，用于快速定位页面节点来源代码。

## 后续计划

- 持续补充更多工程化与源码分析类 Demo。
- 每个 Demo 尽量提供「原理说明 + 可运行示例 + 实现细节」。

# 应用入口与根组件

> 模块路径：`src/main.ts` + `src/App.vue`

## 启动流程

`src/main.ts` 是应用入口，插件注册顺序如下：

1. `createPinia()` — 创建 Pinia 实例
2. `pinia.use(piniaPluginPersistedstate)` — 注册持久化插件
3. `app.use(pinia)` — 挂载状态管理
4. `app.use(router)` — 挂载路由
5. `app.mount('#app')` — 挂载到 DOM

顺序不可调换：pinia 必须先于 router 挂载，否则路由守卫中访问 store 会报错。

## App.vue 结构

根组件使用 Naive UI 的 Provider 包裹整个应用：

- `NConfigProvider` — 全局配置（主题、国际化等），当前未传入自定义配置
- `NMessageProvider` — 提供 `useMessage()` 消息通知能力，内部所有组件可调用

包裹层级：`NConfigProvider > NMessageProvider > 页面内容`

模板结构分为两部分：
- `header` — 顶部导航栏，包含项目标题和 `RouterLink`
- `main` — `<RouterView />` 渲染当前路由页面

## 注意事项

- Naive UI 的 Provider 必须在组件树外层，否则子组件无法通过 hooks（如 `useMessage`）获取上下文
- 新增 Naive UI 功能性 Provider 时，统一加在 `App.vue` 的 `<n-config-provider>` 内部

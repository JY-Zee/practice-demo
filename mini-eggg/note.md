# 搭建mini-egg-core: 内核

- index.js
  - 初始化各种loader
  - 编写各种loader
  - 初始化环境变量的配置
  - 加载各种loader
  - 注册全局中间件 由用户提供
  - 加载routerLoader
  - 启动服务,是否有问题
  - 
- 编写业务后端代码(app文件夹)
  - eslint oxc等格式化工具
  - git 提交规则校验工具
  - 创建controller,service,extend,middlewares,router,public文件夹
    - api
      - router, controller, service
    - page
      - router, controller, public-output页面模版
  - 编写controller,service,extend,middlewares,router,public文件
  - 添加代码健壮性
    - 添加error-handle错误兜底
    - 添加logger插件
    - 验证接口是否有效
      - 通过 api-sign-verify 中间件验证签名是否合法 (通过headers的s_sign和s_t参数验证)
      - 其他方式,ip白名单,token等校验方式, 可根据需求自行添加
    - 接口参数校验 json-schema  ajv (这里需要验证 $schema 使用哪一个版本, ajv 会对 $schema 有要求)

# 编写页面代码&解析引擎

将业务代码,通过解析引擎(webpack,vite,rollup,rolldown等),生成最终的html,css,js代码,被koa所调用渲染,输出页面

解析引擎:

- 解析编译 如vue,react,css,less,png,woff,tpl,nodo_modules等
- 模块分包,懒加载,
- 压缩优化

业务大概文件目录:

- common 工具包
- store
- widgets 组件库
- entry1
- entry2
- ...

通过解析引擎解析之后,得出

产物文件:

- dist
  - js
    - xxx.min.js
  - css
    - xxx.min.css
  - asserts
    - xxx.min.png
    - xxx.min.woff
  - entry.tpl
  - entry2.tpl

## 解析编译

1. 从入口,分析依赖, import xxx
1. 编译
  1. .vue - vue-loader
  1. .less - less-loader
  1. .js - babel-loader
  1. .png - file-loader
  1. .woff - file-loader
  1. .tpl - nunjucks-loader
1. 输出产物
  1. js
  2. css
  3. asserts
  4. entry.tpl

## 模块分包
cacheGroups：打包第三包库， 公共模块
1. 分析上个步骤的产物
1. 模块拆分
  1. abc.js
    1. a.js
    1. b.js
    1. c.js
1. 输出产物
  1. 若干小的js
  2. 若干小的css
  3. asserts
  4. entry.tpl

## 压缩优化

环境分流
- 生产环境
  - 压缩混合 js,css,assests
- 开发环境
  - 资源注入内存
  - 本地服务,热更新
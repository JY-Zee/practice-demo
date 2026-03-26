const Koa = require("koa");
const path = require("path");
const { sep } = path; // 兼容不同操作系统路径分隔符

const env = require("./env");

// 引入各种 loader
const middlewareLoader = require("./loader/middleware");
const routerLoader = require("./loader/router");
const controllerLoader = require("./loader/controller");
const serviceLoader = require("./loader/service");
const extendLoader = require("./loader/extend");
const configLoader = require("./loader/config");
const routerSchemaLoader = require("./loader/router-schema");

module.exports = {
  start(options = {}) {
    const app = new Koa();

    // 缓存配置
    app.options = options;

    // 项目根目录 基础路径
    app.baseDir = process.cwd();

    // 业务文件代码路径
    app.businessPath = path.resolve(app.baseDir, `.${sep}app`);

    // 打印 options、baseDir、businessPath，方便调试查看
    console.log("--- [start]:options:", app.options + " --->");
    console.log("--- [start]:baseDir:", app.baseDir + " --->");
    console.log("--- [start]:businessPath:", app.businessPath + " --->");

    // 初始化环境变量
    app.env = env(app);

    // 使用控制台颜色高亮当前环境
    // \x1b[32m: 绿色字体，\x1b[0m: 重置颜色
    console.log(`\x1b[32m--- [start]:app.env: ${app.env.get()} --->\x1b[0m`);

    // 加载各种loader
    middlewareLoader(app);
    console.log("--- [start]:middlewareLoader loaded --->");
    controllerLoader(app);
    console.log("--- [start]:controllerLoader loaded --->");
    serviceLoader(app);
    console.log("--- [start]:serviceLoader loaded --->");
    configLoader(app);
    console.log("--- [start]:configLoader loaded --->");
    extendLoader(app);
    console.log("--- [start]:extendLoader loaded --->");
    routerSchemaLoader(app);
    console.log("--- [start]:routerSchemaLoader loaded --->");
    routerLoader(app); // 最后加载，因为需要依赖其他loader加载的配置
    console.log("--- [start]:routerLoader loaded --->");

    // 启动服务
    try {
      const port = process.env.PORT || 8080;
      const host = process.env.HOST || "0.0.0.0";

      app.listen(port, host, () => {
        console.log(`Server is running on http://${host}:${port}`);
      });
    } catch (error) {
      console.error(error);
    }
  },
};

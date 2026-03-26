const path = require("path");
const glob = require("glob");
const { sep } = path;

/**
 * 加载所有中间件
 * @param {*} app - 应用实例
 * 可通过 app.middleware.[目录].[文件] 访问到中间件
 */
module.exports = (app) => {
  // 读取 middleware/**/*.js

  const middlewaresPath = path.resolve(app.businessPath, `.${sep}middlewares`);

  // 遍历所有文件目录，内容加载到app.middlewares下
};

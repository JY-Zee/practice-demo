const path = require("path");
const glob = require("glob");

// 不同平台的斜杠符号
const { sep } = path;

/**
 * 加载所有中间件
 * @param {*} app - 应用实例
 * 可通过 app.middlewares.[目录].[文件] 访问到中间件
 *
 * app/middlewares
 * -- custom-module
 *    -- custom-middleware.js
 */
module.exports = (app) => {
  // 读取 middlewares/**/*.js
  const middlewaresPath = path.resolve(app.businessPath, `.${sep}middlewares`);
  const fileList = glob.sync(
    path.resolve(middlewaresPath, `.${sep}**${sep}**.js`),
  );

  // 遍历所有文件目录，内容加载到app.middlewares下
  const middlewares = {};

  fileList.forEach((file) => {
    // 提取文件名
    let name = path.resolve(file);

    // 截取路径 app/middleware/custom-module/custom-middleware.js => custom-module/custom-middleware
    name = name.substring(
      name.lastIndexOf(`middlewares${sep}`) + `middlewares${sep}`.length,
      name.lastIndexOf("."),
    );

    // 把 - 改为驼峰式  app.middlewares.customModule.customMiddleware
    name = name.replace(/[_-][a-z]/gi, (s) => s.substring(1).toUpperCase());

    const names = name.split(sep)


    // 挂在middleware到内存里
    let tempMiddleware = middlewares;
    for (let i = 0, len = names.length; i < len; i++) {
      if (i === len - 1) {
        // 最后一位 就是文件名
        // 加载文件,执行,把app作为参数传递进去进行解析
        tempMiddleware[names[i]] = require(path.resolve(file))(app);
      } else {
        // 文件夹名字
        if (!tempMiddleware[names[i]]) {
          tempMiddleware[names[i]] = {};
        }
        tempMiddleware = tempMiddleware[names[i]];
      }
    }

  });

  app.middlewares = middlewares;
};

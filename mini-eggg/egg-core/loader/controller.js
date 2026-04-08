const path = require("path");
const glob = require("glob");

// 不同平台的斜杠符号
const { sep } = path;

/**
 * 加载所有中间件
 * @param {*} app - 应用实例
 * 可通过 app.controller.[目录].[文件] 访问到中间件
 *
 * app/controller
 * -- custom-module
 *    -- custom-controller.js 
 */
module.exports = (app) => {
  // 读取 controller/**/*.js
  const controllersPath = path.resolve(app.businessPath, `.${sep}controller`);
  const fileList = glob.sync(
    path.resolve(controllersPath, `.${sep}**${sep}**.js`),
  );

  // 遍历所有文件目录，内容加载到app.controllers下
  const controller = {};

  fileList.forEach((file) => {
    // 提取文件名
    let name = path.resolve(file);

    // 截取路径 app/controller/custom-module/custom-controller.js => custom-module/custom-controller
    name = name.substring(
      name.lastIndexOf(`controller${sep}`) + `controller${sep}`.length,
      name.lastIndexOf("."),
    );

    // 把 - 改为驼峰式  app.controllers.customModule.customcontroller
    name = name.replace(/[_-][a-z]/gi, (s) => s.substring(1).toUpperCase());

    const names = name.split(sep)

    // 挂在controller到内存里
    let tempcontroller = controller;
    for (let i = 0, len = names.length; i < len; i++) {
      if (i === len - 1) {
        // 最后一位 就是文件名
        // 加载文件,执行,把app作为参数传递进去进行解析
        const ControllerModule = require(path.resolve(file))(app);
        tempcontroller[names[i]] = new ControllerModule();
      } else {
        // 文件夹名字
        if (!tempcontroller[names[i]]) {
          tempcontroller[names[i]] = {};
        }
        tempcontroller = tempcontroller[names[i]];
      }
    }

  });

  console.log('controllers', controller)

  app.controller = controller;
};

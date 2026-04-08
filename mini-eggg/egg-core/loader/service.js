const path = require("path");
const glob = require("glob");

// 不同平台的斜杠符号
const { sep } = path;

/**
 * 加载所有中间件
 * @param {*} app - 应用实例
 * 可通过 app.service.[目录].[文件] 访问到中间件
 *
 * app/service
 * -- custom-module
 *    -- custom-service.js 
 */
module.exports = (app) => {
  // 读取 service/**/*.js
  const servicesPath = path.resolve(app.businessPath, `.${sep}service`);
  const fileList = glob.sync(
    path.resolve(servicesPath, `.${sep}**${sep}**.js`),
  );

  // 遍历所有文件目录，内容加载到app.services下
  const service = {};

  fileList.forEach((file) => {
    // 提取文件名
    let name = path.resolve(file);

    // 截取路径 app/service/custom-module/custom-service.js => custom-module/custom-service
    name = name.substring(
      name.lastIndexOf(`service${sep}`) + `service${sep}`.length,
      name.lastIndexOf("."),
    );

    // 把 - 改为驼峰式  app.services.customModule.customservice
    name = name.replace(/[_-][a-z]/gi, (s) => s.substring(1).toUpperCase());

    const names = name.split(sep)


    // 挂在service到内存里
    let tempservice = service;
    for (let i = 0, len = names.length; i < len; i++) {
      if (i === len - 1) {
        // 最后一位 就是文件名
        // 加载文件,执行,把app作为参数传递进去进行解析
        const ServiceModule = require(path.resolve(file))(app);
        tempservice[names[i]] = new ServiceModule();
      } else {
        // 文件夹名字
        if (!tempservice[names[i]]) {
          tempservice[names[i]] = {};
        }
        tempservice = tempservice[names[i]];
      }
    }
  });
  app.service = service;
};

const path = require("path");
const glob = require("glob");

// 不同平台的斜杠符号
const { sep } = path;

/**
 * 加载所有拓展
 * @param {*} app - 应用实例
 * 可通过 app.extend.[文件] 访问到拓展
 *
 * app/extend
 * -- custom-extend.js 
 */
module.exports = (app) => {
  // 读取 extend/**/*.js
  const extendsPath = path.resolve(app.businessPath, `.${sep}extend`);
  const fileList = glob.sync(
    path.resolve(extendsPath, `.${sep}**${sep}**.js`),
  );

  // 遍历所有文件目录，内容加载到app.extends下
  const extend = {};

  fileList.forEach((file) => {
    // 提取文件名
    let name = path.resolve(file);

    // 截取路径 app/extend/custom-extend.js => custom-extend.js
    name = name.substring(
      name.lastIndexOf(`extend${sep}`) + `extend${sep}`.length,
      name.lastIndexOf("."),
    );

    // 把 - 改为驼峰式  app.extends.customModule.customextend
    name = name.replace(/[_-][a-z]/gi, (s) => s.substring(1).toUpperCase());

    // 过滤app已经存在的key
    for (const key in app) {
      if (key === name) {
        console.error(`extend ${name} 已存在, 请更换名字`);
        return
      }
    };

    app[name] = require(path.resolve(file))(app)
  });
}

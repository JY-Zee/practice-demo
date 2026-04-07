const path = require("path");
const glob = require("glob");
// 不同平台的斜杠符号
const { sep } = path;

/**
 * @param {object} app koa 实例
 * 通过 ‘json-schema’ & ‘ajv’ 解析, 对API规则进行约束,配合api-params-verify使用
 * app/router-schema/**.js
 * 期望输出
 * app.routerSchema = {
 *  api1: ${jsonSchema}
 *  api2: ${jsonSchema}
 *  api3: ${jsonSchema}
 * }
 */
module.exports = (app) => {
  // 读取 routerSchema/**/*.js
  const routerSchemaPath = path.resolve(
    app.businessPath,
    `.${sep}routerSchema`,
  );
  const fileList = glob.sync(
    path.resolve(routerSchemaPath, `.${sep}**${sep}**.js`),
  );

  // 注册所有router-schema,使得可以 app.routerSchema 访问
  const routerSchema = {};

  fileList.forEach(file => {
    routerSchema = {
      ...routerSchema,
      ...require(path.resolve(file))
    }
  });

  app.routerSchema = routerSchema;
};

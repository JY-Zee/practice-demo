const path = require("path");
const glob = require("glob");

// 不同平台的斜杠符号
const { sep } = path;


/**
 * 
 * @param {*} app  koa实例
 * 区分 本地/测试/生产环境的配置文件
 * 通过env, 读取不同环境的配置文件 env.config
 * 通过env.config,覆盖到default.config上,挂在到app.config上
 * 目录结构:
 * - config
 *   - config.default.js 默认配置
 *   - config.local.js 本地环境配置
 *   - config.beta.js 测试环境配置
 *   - config.production.js 生产环境配置
 */
module.exports = (app) => {
  // 找到config目录
  const configPath = path.resolve(app.baseDir, `.${sep}config`);

  // 获取defalut.config
  let defalutConfig = {}
  try {
    defalutConfig = require(path.resolve(configPath, `.${sep}config.default.js`));
  } catch (error) {
    console.error("未找到默认配置文件 config.default.js");
  }

  // 获取env环境
  let envConfig = {};
  try {
    // if (app.env.isLocal()) {
    //   envConfig = require(path.resolve(configPath, `.${sep}config.local.js`));
    // } else if (app.env.isBeta()) {
    //   envConfig = require(path.resolve(configPath, `.${sep}config.beta.js`));
    // } else if (app.env.isProduction()) {
    //   envConfig = require(path.resolve(configPath, `.${sep}config.production.js`));
    // }
    envConfig = require(path.resolve(configPath, `.${sep}config.${app.env.get()}.js`));
  } catch (error) {
    console.error("未找到环境配置文件 config." + app.env + ".js");
  }

  // 覆盖并加载config
  app.config = Object.assign({}, defalutConfig, envConfig);
};



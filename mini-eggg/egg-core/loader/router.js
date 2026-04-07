const path = require("path");
const glob = require("glob");
const KoaRouter = require('koa-router')

// 不同平台的斜杠符号
const { sep } = path;


/**
 * 
 * @param {*} app 
 * 解析所有的app/router下的所有js文件,加载到koarouter下
 */
module.exports = (app) => {
  // 找到 app/router/**/*.js
  const routerPath = path.resolve(app.businessPath, `.${sep}router`);

  // 实例化 koarouter
  const router = new KoaRouter()

  // 注册所有路由
  const fileList = glob.sync(path.resolve(routerPath, `.${sep}**${sep}**.js`))

  fileList.forEach(file => {
    const a = require(path.resolve(file))(app, router)
  });

  // 兜底路由
  router.get('*', async (ctx, next) => {
    ctx.status = 302
    ctx.redirect(app?.options?.homePath || '/')
  })


  // 路由注册到app上
  app.use(router.routes())
  app.use(router.allowedMethods())
};

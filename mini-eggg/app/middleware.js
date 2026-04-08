const path = require('path')
const { sep } = path

module.exports = (app) => {

  // 配置静态根目录
  const koaStatic = require('koa-static')
  app.use(koaStatic(path.resolve(process.cwd(), `.${sep}app${sep}public`)))

  // 模版渲染引擎
  const koaNunjucks = require('koa-nunjucks-2')

  app.use(koaNunjucks({
    ext: 'tpl',
    path: path.join(process.cwd(), `.${sep}app${sep}public`),
    nunjucksConfig: {
      noCache: true,
      trimBlocks: true
    }
  }))
}
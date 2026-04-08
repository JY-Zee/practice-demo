const path = require('path')
const { sep } = path

module.exports = (app) => {
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
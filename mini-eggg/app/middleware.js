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

  // 使用koa-parser 解析请求的body
  const bodyParser = require('koa-bodyparser')
  app.use(bodyParser({
    formLimit: '1000mb',
    enableTypes: ['json', 'form', 'text']
  }))


  // 引入异常捕获中间件
  app.use(app.middlewares.errorHandle)

  // 签名合法性校验
  app.use(app.middlewares.apiSignVerify)
}
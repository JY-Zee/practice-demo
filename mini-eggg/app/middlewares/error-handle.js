/**
 * 运行时异常错误处理 兜底所有异常
 * 每个中间件 都是返回一个async函数 
 * @param {*} app 
 */
module.exports = (app) => {
  return async (ctx, next) => {
    try {
      await next()
    } catch (error) {
      // 异常处理
      const { status, message, detail } = error

      app.logger.info(JSON.stringify(error))
      app.logger.error('[-- exception --]:', error)
      app.logger.error('[-- exception --]:', status, message, detail)

      if (message && message.indexOf('not found') > -1) {
        // 用户访问了一个页面不存在的路径 页面重定向
        ctx.status = 302;
        ctx.redirect(app?.options?.homePage || '/')
        return;
      }

      // 因为报错了, 它不会经过controller包装, 所以需要手动包装
      const resBody = {
        success: false,
        code: 500,
        message: '服务异常,请稍后再试'
      }
      // 网络正常 200 但是业务异常 需要手动包装
      ctx.status = 200;
      ctx.body = resBody
    }
  }
}
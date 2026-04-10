const md5 = require('md5')
/**
 * api 签名合法性
 * @param {*} app 
 */
module.exports = (app) => {
  return async (ctx, next) => {

    // 非api前缀的请求, 放行
    if (ctx.path.indexOf('/api/') !== 0) {
      await next()
      return
    }
    // 只处理API请求
    const { path, method } = ctx

    const { headers } = ctx.request
    const { s_sign: sSign, s_t: st } = headers

    // 随意定义一个签名key 当作密钥
    const signKey = '1234567890';

    const signature = md5(`${signKey}_${st}`)

    app.logger.info(`[-- api sign verify --]: method: ${method}, path: ${path}, sSign: ${sSign}, st: ${st}, signature: ${signature}`)


    // 校验签名参数是否合法:
    // - sSign 或 st 缺失时不通过
    // - 签名与服务端生成的不一致时不通过
    // - 签名过期（时间戳相差超过10分钟）时不通过
    if (!sSign || !st || signature !== sSign.toLowerCase() || Date.now - st > 600000) {
      ctx.status = 200
      ctx.body = {
        code: 445,
        success: false,
        message: 'signature not correct'
      }
      return
    }

    await next()



  }
}
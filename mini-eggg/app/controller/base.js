module.exports = (app) => {
  return class BaseController {


    /**
     * 基类 同一收拢controller的公共方法
     */
    constructor() {
      this.app = app
      this.config = app.config
    }

    /**
     * api 处理成功时候的结构
     * @param {*} ctx 上下文
     * @param {*} data 核心数据
     * @param {*} metadata 
     */
    success(ctx, data = {}, metadata = {}) {
      ctx.status = 200
      ctx.body = {
        success: true,
        data,
        metadata
      }
    }

    /**
     * api 处理失败时候的结构
     * @param {*} ctc 
     * @param {*} message 
     */
    fail(ctc, message = '', code) {
      ctx.body = {
        success: false,
        message,
        code
      }
    }
  }
}
const Ajv = require('ajv')

const ajv = new Ajv()


/**
 * api 参数校验
 * @param {*} app 
 * @returns 
 */
module.exports = (app) => {
  return async (ctx, next) => {
    const $schema = 'https://json-schema.org/draft/2020-12/schema'

    // 非api前缀的请求, 放行
    if (ctx.path.indexOf('/api/') !== 0) {
      await next()
      return
    }

    const { path, method } = ctx
    const { query, body, params, headers } = ctx.request

    app.logger.info(`[-- api params verify --]:`)
    app.logger.info(`  method: ${method} path: ${path} query: ${JSON.stringify(query)}`)
    app.logger.info(`  body: ${JSON.stringify(body)}`)
    app.logger.info(`  params: ${JSON.stringify(params)}`)
    // app.logger.info(`  headers: ${JSON.stringify(headers)}`)
    const schema = app.routerSchema[path]?.[method.toLowerCase()]

    console.log('schema', app.routerSchema, path)
    if (!schema) {
      // 没有找到对应的schema, 放行
      await next()
      return
    }

    let valid = true

    let validate = null;
    // 校验 headers
    if (valid && headers && schema.headers) {
      // schema.headers.$schema = $schema

      // 编译headers的schema, 得出一个验证函数
      validate = ajv.compile(schema.headers)

      // 使用验证函数验证, 得到结果
      valid = validate(headers)
    }

    // 校验 body
    if (valid && body && schema.body) {
      // schema.body.$schema = $schema

      // 编译body的schema, 得出一个验证函数
      validate = ajv.compile(schema.body)

      // 使用验证函数验证, 得到结果
      valid = validate(body)
    }

    // 校验 query
    if (valid && query && schema.query) {
      // schema.query.$schema = $schema

      // 编译query的schema, 得出一个验证函数
      validate = ajv.compile(schema.query)

      // 使用验证函数验证, 得到结果
      valid = validate(query)
    }

    if (!valid) {
      // 意味着用户传过来的数据有问题
      ctx.status = 200
      ctx.body = {
        success: false,
        code: 442,
        message: `request validate failed: ${ajv.errorsText(validate.errors)}`
      }
      return
    }
    await next()
  }
}
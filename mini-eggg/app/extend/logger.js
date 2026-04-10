const log4js = require('log4js')
const path = require('path')
const { sep } = path
/**
 * 日志工具
 * 外部调用logger.log  logger.error 
* @param {*} app 
 */
module.exports = (app) => {

  let logger;

  if (app.env.isLocal()) {
    //  打印在控制台
    logger = console
  } else {
    // 把日志输入并落地到磁盘
    log4js.configure({
      appenders: {
        console: {
          type: 'console'
        },
        // 日志文件切分 按天切分
        dateFile: {
          type: 'dateFile',
          filename: path.resolve(app.baseDir, `.${sep}logs${sep}application.log`),
          pattern: '.yyyy-MM-dd',
          daysToKeep: 30
        }
      },
      categories: {
        default: {
          appenders: ['console', 'dateFile'],
          level: 'trace'
        }
      }

    })
    logger = log4js.getLogger()
  }
  return logger


}
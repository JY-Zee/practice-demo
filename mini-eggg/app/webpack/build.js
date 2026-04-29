const webpack = require('webpack')


const webBaseConfig = require('./config/webpack.base.js')

console.log('\n--- [build]:webpack building --->\n')
// console.log('\n--- [build]:webpack base config --->\n')
// console.log(webBaseConfig)
// console.log('\n--- [build]:webpack base config end --->\n')


webpack(webBaseConfig, (err, stats) => {
  if (err) {
    console.error(err)
    return
  }
  // console.log(stats.toString({
  //   colors: true
  // }))
  process.stdout.write(stats.toString({
    colors: true,   // 打印出色彩信息
    modules: false,  // 不打印模块信息
    children: false, // 不打印子模块信息
    chunks: false,   // 不打印每个代码块信息
    chunkModules: true, // 不打印代码块中模块的信息
    // chunkOrigins: false, // 不打印chunk来源信息
    // chunkRoot: false, // 不打印chunk根信息
    // chunkModulesRoot: false, // 不打印chunk模块根信息
    // chunkOriginsRoot: false, // 不打印chunk来源根信息
  }) + '\n\n')

}) 
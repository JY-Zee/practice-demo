const merge = require('webpack-merge')

const webBaseConfig = require('./webpack.base.js')

// 配置生产 webpack 配置
const webpackConfig = merge(webBaseConfig, {
  mode: 'development',
  output: {
    
  }
})

module.exports = webpackConfig

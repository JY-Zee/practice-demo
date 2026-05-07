const merge = require('webpack-merge')
const os = require('os')
const path = require('path')
const webBaseConfig = require('./webpack.base.js')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const HtmlWebpackInjectAttributesPlugin = require('html-webpack-inject-attributes-plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin')

const prodBaseConfig = {
  ...webBaseConfig,
  module: {
    ...webBaseConfig.module,
    // 生产环境需要替换 js/css loader，避免与基础配置重复执行
    rules: webBaseConfig.module.rules.filter(rule => !['/\\.js$/', '/\\.css$/'].includes(String(rule.test)))
  }
}
const buildWorkerCount = Math.max(os.cpus().length - 1, 1)

// 配置生产 webpack 配置
const webpackConfig = merge(prodBaseConfig, {
  mode: 'production',
  output: {
    filename: 'js/[name]_[chunkhash:8].bundle.js',
    path: path.join(process.cwd(), './app/public/dist/prod'),
    publicPath: '/dist/prod',
    crossOriginLoading: 'anonymous',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1
            }
          }
        ],
      },
      {
        test: /\.js$/,
        include: [
          path.resolve(process.cwd(), './app/pages')
        ],
        use: [
          {
            loader: 'thread-loader',
            options: {
              workers: buildWorkerCount,
            }
          },
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: ['@babel/plugin-transform-runtime']
            }
          }
        ],
      },
    ],
  },
  performance: {
    hints: false, // webpack 不会有大量的 hint 信息，默认为 warning
  },
  cache: {
    type: 'filesystem',
  },
  watch: false,
  plugins: [
    // 每次 build 前清空 public/dist
    new CleanWebpackPlugin(['public/dist'], {
      root: path.resolve(process.cwd(), './app'),
      exclude: ['node_modules', 'public/dist'],
      verbose: true, // 是否启用详细输出
      dry: false, // 是否启用模拟删除操作
    }),
    // 提取公共 css，利用缓存，非公共部分使用 inline
    new MiniCssExtractPlugin({
      chunkFilename: 'css/[name]_[chunkhash:8].bundle.css',
    }),
    // 优化并压缩资源  
    new CssMinimizerPlugin({
      parallel: buildWorkerCount,
    }),
    // 浏览器在请求资源时，不发送用户的身份凭证
    new HtmlWebpackInjectAttributesPlugin({
      crossorigin: 'anonymous',
    })
  ],
  optimization: {
    // 使用 TerserPlugin的并发和缓存，提升压缩阶段的性能
    // 清除 console.log
    minimize: true, // 启用压缩
    minimizer: [
      new TerserWebpackPlugin({
        cache: true, // 启用缓存
        parallel: buildWorkerCount, // 启用多核并发
        terserOptions: {
          compress: {
            drop_console: true, // 清除 console.log
          }
        }
      }),
    ],
  }
})

module.exports = webpackConfig

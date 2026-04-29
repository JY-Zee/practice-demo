const path = require('path')
const { sep } = path
const { VueLoaderPlugin } = require('vue-loader')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const glob = require('glob')


const entry = {}
const htmlPluginList = []

// 找出所有的 entry.xxx.js
const entryList = path.resolve(process.cwd(), `.${sep}app${sep}pages${sep}**${sep}entry.**.js`)
// 对每个文件都进行处理，
// 使用 glob.sync 同步查找所有匹配 entryList 模式的文件
// sync 的作用是同步返回结果，避免异步带来的回调或 Promise 管理，让后续代码可以立即处理所有匹配到的文件
glob.sync(entryList).forEach(file => {
  // 得出 文件名
  const entryName = path.basename(file, '.js')
  // 构造 entry
  entry[entryName] = file
  // 构造 htmlplugin 
  htmlPluginList.push(new HtmlWebpackPlugin({
    // 产物(最终模版)输出路径
    filename: path.resolve(process.cwd(), `.${sep}app${sep}public${sep}dist${sep}${entryName}.tpl`),
    // 指定要使用的模版文件
    template: path.resolve(process.cwd(), `.${sep}app${sep}view${sep}entry.tpl`),
    // 要注入的代码快
    chunks: [entryName]
  }))
})


console.log('entry', entry)
console.log('htmlPluginList', htmlPluginList)

/**
 * 
 * webpack 基础配置
 */
module.exports = {
  // 入口配置
  entry: entry,
  // 模块解析配置(决定了要加载解析哪些模块,以及用什么方式去解析)
  module: {
    rules: [{
      test: /\.vue$/,
      use: 'vue-loader'
    },
    {
      test: /\.js$/,
      // 只解析app/pages下的业务js文件  加快webpack打包速度
      include: [path.resolve(process.cwd(), './app/pages')],
      use: 'babel-loader'
    },
    {
      test: /\.css$/,
      use: [
        'style-loader', 'css-loader'
      ]
    },

    {
      test: /\.less$/,
      use: [
        'style-loader', 'css-loader', 'less-loader'
      ]
    },
    {
      test: /\.(png|jpg|gif)(\?.*)?$/,
      use: {
        loader: 'url-loader',
        options: {
          limit: 300,
          // name: 'img/[name].[hash:7].[ext]'
          esModule: false
        }
      }
    },
    {
      test: /\.(woff|woff2|eot|ttf|otf)(\?.*)?$/,
      use: 'file-loader'
    }]
  },
  // 产物输出路径
  output: {
    filename: 'js/[name]_[chunkhash:8].bundle.js',
    path: path.join(process.cwd(), './app/public/dist/prod'),
    publicPath: '/dist/prod',
    crossOriginLoading: 'anonymous',
  },
  // 配置模块解析的具体行为(定义webpack在打包时,如何找到并解析具体模块的路径)
  resolve: {
    extensions: ['.js', '.vue', '.less', '.png', '.woff', '.tpl'],
    alias: {
      $pages: path.resolve(process.cwd(), './app/pages'),
      $common: path.resolve(process.cwd(), './app/pages/common'),
      $widgets: path.resolve(process.cwd(), './app/pages/widgets'),
      $store: path.resolve(process.cwd(), './app/store'),
    } // 别名
  },
  // 插件配置(扩展webpack功能,如压缩,优化,生成html等)
  plugins: [
    // 处理.vue文件,这个插件是必须的
    // 它的职能是将你定义过的其他规则复制并应用到.vue文件里
    // 例如, 如果有一条匹配规则 /\.js$/ 的规则,那么它会应用到 .vue 文件中的<script>
    new VueLoaderPlugin(),
    // 把第三方库暴露到window.context下
    new webpack.ProvidePlugin({
      Vue: 'vue'
    }),
    // 定义全局常量
    new webpack.DefinePlugin({
      // 支持vue解析options api
      __VUE_OPTIONS_API__: true,
      // 禁用vue调试工具
      __VUE_PROD_DEVTOOLS__: false,
      // 禁用vue 生产环境显示水合信息
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    }),
    // 构建最终渲染的页面模版
    ...htmlPluginList,
  ],
  // 配置开发服务器(如热更新,本地服务器等)
  devServer: {},
  // 配置优化(如压缩,优化,生成html等)
  optimization: {
    // 分包配置(将公共模块拆分出来,减少重复打包)
    // 把 js 分成三种类型
    // 1.vender 类 第三方库
    // 2.common 类 公共模块，会被各个页面使用到
    // 3.entry 类 入口模块 正常业务代码
    // 目的：把改动和引用频率不一样的 js 区分出来，达到更好的浏览器缓存效果
    splitChunks: {
      // 对同步和异步模块都进行分包处理   
      chunks: 'all',
      // 最大异步请求数
      maxAsyncRequests: 10,
      // 最大初始请求数
      maxInitialRequests: 10,
      cacheGroups: {
        // 打包第三包库
        vender: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          name: 'vender',
          enforce: true, // 强制执行
          reuseExistingChunk: true, // 重用已有的chunk，不用重新打包
        },
        // 公共模块
        common: {
          name: 'common', // 名称
          priority: -20, // 优先级
          minChunks: 2, // 最小引用次数，只有有两个地方被引用到，就被认为是一个公共模块
          minSize: 1, // 最小文件分割大小，只有大于1kb的模块才会被分割
          reuseExistingChunk: true, // 重用已有的chunk，不用重新打包
        },
      },
    }
  },
  // 配置 其他(如watch,stats等)
  watch: true,
  // 配置其他(如watch,stats等)
}
import path from 'node:path'
import type { Plugin } from 'vite'
import { parse as parseSfc } from '@vue/compiler-sfc'
import { NodeTypes, parse as parseTemplate, type ElementNode, type Node } from '@vue/compiler-dom'

// 统一属性名，避免魔法字符串散落在逻辑中。
const DATA_SRC_ATTR = 'data-src'

function isVueSfc(id: string): boolean {
  // 只处理 .vue 文件，跳过 js/ts/css 等资源。
  return id.endsWith('.vue')
}

function normalizeToPosixPath(filePath: string): string {
  // Windows 下是反斜杠，这里统一成 /，保证注入结果可读且一致。
  return filePath.replaceAll('\\', '/')
}

function computeInsertOffset(templateCode: string, element: ElementNode): number | null {
  // 元素在 template 字符串中的起始偏移（从 0 开始）。
  const startOffset = element.loc.start.offset
  // 当前元素的原始源码片段，例如 "<div class='a'>...</div>"。
  const locSource = element.loc.source
  // 尝试匹配起始标签名：<div、<span、<my-comp 等。
  const tagMatch = locSource.match(/^<([^\s/>]+)/)

  if (tagMatch) {
    // 属性应该插入到“标签名后面”，例如 <div data-src="...">。
    return startOffset + tagMatch[0].length
  }

  // 兜底分支：如果正则未匹配成功，按字符扫描找到起始标签名结束位置。
  let cursor = startOffset
  while (cursor < templateCode.length && templateCode[cursor] !== '<') {
    cursor += 1
  }
  if (cursor >= templateCode.length) {
    return null
  }
  cursor += 1
  while (cursor < templateCode.length && !/[\s/>]/.test(templateCode[cursor])) {
    cursor += 1
  }
  return cursor
}

function walkAst(node: Node, visitor: (current: Node) => void): void {
  // 先访问当前节点（前序遍历）。
  visitor(node)

  // 递归遍历子节点。
  if ('children' in node && Array.isArray(node.children)) {
    node.children.forEach((child) => walkAst(child, visitor))
  }
}

function injectDataSrcToTemplate(
  templateCode: string,
  relativeFilePath: string,
  templateStartLine: number,
): string {
  // 解析 template AST，comments: false 可减少无关注释节点。
  const ast = parseTemplate(templateCode, { comments: false })
  // 先记录所有插入点，最后统一回写。
  const inserts: Array<{ offset: number; text: string }> = []

  walkAst(ast, (current) => {
    // 只对“元素节点”注入，文本/表达式节点跳过。
    if (current.type !== NodeTypes.ELEMENT) {
      return
    }

    const element = current as ElementNode
    // 避免重复注入 data-src。
    const hasDataSrc = element.props.some((prop) => {
      return prop.type === NodeTypes.ATTRIBUTE && prop.name === DATA_SRC_ATTR
    })
    if (hasDataSrc) {
      return
    }

    // 计算该元素起始标签的属性插入位置。
    const insertOffset = computeInsertOffset(templateCode, element)
    if (insertOffset === null) {
      return
    }

    // 模板内行号 + template 起始行号偏移，得到 .vue 文件真实行号。
    const line = templateStartLine + element.loc.start.line - 1
    inserts.push({
      offset: insertOffset,
      text: ` ${DATA_SRC_ATTR}="${relativeFilePath}:${line}"`,
    })
  })

  if (inserts.length === 0) {
    // 没有可注入节点，直接返回原模板。
    return templateCode
  }

  // 倒序插入，避免前面的插入影响后面记录的 offset。
  inserts.sort((a, b) => b.offset - a.offset)
  let nextCode = templateCode
  inserts.forEach(({ offset, text }) => {
    nextCode = `${nextCode.slice(0, offset)}${text}${nextCode.slice(offset)}`
  })
  return nextCode
}

export function vueDataSrcPlugin(): Plugin {
  // Vite 项目根目录，用于把绝对路径转换成相对路径。
  let projectRoot = ''

  return {
    name: 'vite-plugin-vue-data-src',
    // 仅开发态生效（vite dev），不污染 build 产物。
    // apply 属性可枚举为 'build' | 'serve' | ((...args) => boolean)：
    // - 'serve'：仅在开发环境(vite dev)生效
    // - 'build'：仅在构建产物(vite build)生效
    // - 函数类型：接收命中参数，返回布尔值决定插件当前环境生效与否
    apply: 'serve',
    // 在 @vitejs/plugin-vue 前先改源码，确保后续编译拿到的是注入后的模板。
    // enforce 有哪些枚举？
    // 官方支持的枚举值为 'pre' | 'post' | undefined，
    // 其中:
    // - 'pre'    ：表示插件在内置插件（如 @vitejs/plugin-vue）之前执行
    // - 'post'   ：表示插件在内置插件之后执行
    // - undefined：默认按插件数组顺序执行
    enforce: 'pre',
    /**
     * configResolved 钩子由 Vite 在解析完最终配置后调用。
     * 作用：拿到 Vite 项目的根目录（config.root），用于后续把绝对路径转换为项目内的相对路径，方便生成 data-src。
     * 官方文档：https://cn.vitejs.dev/config/#configresolved
     */
    configResolved(config) {
      projectRoot = config.root
    },
    /**
     * transform 钩子是 Vite 插件 API 提供的一个生命周期方法，用于对每个模块源码进行转换或分析。
     * 入参：
     *   - code：类型为 string，表示当前模块（如 .vue、.js 等）的源码内容。
     *   - id：类型为 string，表示当前模块的绝对路径以及 query（如 "src/App.vue?vue&type=template"）。
     *        id 形如 "/绝对路径/xxx.vue" 或 "/绝对路径/xxx.vue?vue&type=template"。
     * 在本插件中，transform 用于检测和处理 .vue 文件，修改其 <template> 区块内容并注入 data-src 属性。
     * 详细参考：https://cn.vitejs.dev/api/plugin-hooks/#transform
     */
    transform(code, id) {
      // Vite 会给请求拼 query（如 ?vue&type=template），这里只要真实文件路径。
      const [filePath] = id.split('?')
      if (!isVueSfc(filePath)) {
        return null
      }

      const normalizedFilePath = normalizeToPosixPath(filePath)
      // 生成写入 data-src 的“相对路径”部分。
      const relativeFilePath = normalizeToPosixPath(path.relative(projectRoot, filePath))
      const { descriptor } = parseSfc(code, { filename: normalizedFilePath })
      const template = descriptor.template

      if (!template || !template.content.trim()) {
        return null
      }

      const nextTemplateContent = injectDataSrcToTemplate(
        template.content,
        relativeFilePath,
        // template.loc 是 vue SFC 解析后描述 <template> 源码位置信息的对象，结构为 { start: { line, column, offset }, end: { ... }, source }
        // 其中 start.line 表示 <template> 区块起始行号（从 1 开始）
        template.loc.start.line,
      )

      if (nextTemplateContent === template.content) {
        return null
      }

      // 只替换 <template> 的内容区域，不改 script/style。
      const contentStart = template.loc.start.offset
      const contentEnd = template.loc.end.offset
      const nextCode = `${code.slice(0, contentStart)}${nextTemplateContent}${code.slice(contentEnd)}`

      return {
        code: nextCode,
        map: null,
      }
    },
  }
}

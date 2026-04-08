const path = require('path')
const { sep } = path

module.exports = (app) => {
  return class ProjectController {

    /**
     * 获取项目列表
     */
    async getList(ctx) {
      const { project: projectService } = app.service
      const res = await projectService.getList()
      ctx.status = 200
      ctx.body = {
        success: true,
        data: res,
        metadata: {}
      }
    }

    /**
     * 渲染页面
     * @param {*} ctx 
     */
    async renderPage(ctx) {
      await ctx.render(`output${sep}entry.${ctx.params.page}`, {
        name: app.options?.name,
        env: app.env.get()
      })
    }
  }
}
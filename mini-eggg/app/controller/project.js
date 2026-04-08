const path = require('path')
const { sep } = path


module.exports = (app) => {
  const BaseController = require(`.${sep}base`)(app)
  return class ProjectController extends BaseController {

    /**
     * 获取项目列表
     */
    async getList(ctx) {
      const { project: projectService } = app.service

      const body = ctx.request.body
      console.log('1',body)

      const res = await projectService.getList()
      this.success(ctx, res)
    }

  }
}
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
      const res = await projectService.getList()
      app.logger.info('project list', res)
      this.success(ctx, res)
    }

  }
}
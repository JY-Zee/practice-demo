module.exports = (app, router) => {
  const { project: projectController } = app.controller

  router.post('/api/project/list', projectController.getList.bind(projectController))
}  
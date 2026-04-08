module.exports = (app, router) => {

  console.log('first', app.controller)
  const { project: projectController } = app.controller

  router.get('/api/project/list', projectController.getList.bind(projectController))
}  
module.exports = (app, router) => {
  const { view: viewController } = app.controller

  // 用户浏览器输入 /view/xxx。就可以访问页面xxx
  router.get('/view/:page', viewController.renderPage.bind(viewController))
}
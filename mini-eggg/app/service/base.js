
const superagent = require('superagent')

module.exports = (app) => {
  // 基层
  return class BaseService {
    constructor() {
      this.app = app
      this.config = app.config
      this.curl = superagent
    }
  }
}
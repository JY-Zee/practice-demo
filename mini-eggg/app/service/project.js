const path = require('path')
const { sep } = path

module.exports = (app) => {
    const BaseService = require(`.${sep}base`)(app)
    return class ProjectService extends BaseService {
        async getList() {
            return [{
                name: "project1"
            },
            {
                name: "project2"
            },
            {
                name: "project3"
            },
            ]
        }
    }
}
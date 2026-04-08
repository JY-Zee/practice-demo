module.exports = (app) => {
    return class ProjectService {
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
module.exports = {
  '/api/project/list': {
    post: {
      query: {
        type: 'object',
        properties: {
          proj_key: {
            type: 'string',
          }
        },
        required: ['proj_key']
      },
      // body: {},
      // params: {},
    }
  }
}
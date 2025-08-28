import * as server from '../../src/server/index'

export const startServer = (params, cb) => {
  server.create(params)
    .then( server => cb(null, server) )
    .catch( err => cb(err) )
}

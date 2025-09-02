export const startServer = (params, cb) => {
  // Use test-compatible server version for Jest
  import('../../src/server/index.test.js')
    .then(server => {
      console.log('Test server module loaded, creating server...');
      return server.create(params);
    })
    .then(result => {
      console.log('Test server created successfully');
      cb(null, result);
    })
    .catch(err => {
      console.error('Test server startup failed:', err);
      cb(err);
    });
}

import { create } from '../src/server/index-test.js';

describe('Server Index', () => {
  test('should export create function', () => {
    expect(typeof create).toBe('function');
  });

  test('should create server with valid parameters', async () => {
    const params = {
      host: '127.0.0.1',
      port: 3005, // Use different port to avoid conflicts
      url: 'http://127.0.0.1:3005'
    };
    
    const server = await create(params);
    expect(server).toHaveProperty('stop');
    expect(typeof server.stop).toBe('function');
    
    // Clean up
    await new Promise((resolve) => {
      server.stop(resolve);
    });
  });

  test('should handle server creation errors gracefully', async () => {
    const params = {
      host: '127.0.0.1',
      port: -1, // Invalid port
      url: 'http://127.0.0.1:-1'
    };
    
    await expect(create(params)).rejects.toThrow();
  });
});

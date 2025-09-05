// Test-compatible version of server index for Jest
// This avoids the import.meta.url issue while maintaining the same functionality

import express from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import debug from 'debug';
import fs from 'fs';
import registerSocketHandlers from './socketHandlers.js';

// For tests, use a simple __dirname equivalent
const __dirname = process.cwd() + '/src/server';

const logerror = debug('tetris:error'), loginfo = debug('tetris:info');

export function create(params) {
  const promise = new Promise((resolve, reject) => {
    const app = express();
    const { host, port } = params;

    // Security and CORS
    app.use(helmet());
    app.use(cors());

    // Health check endpoint
    app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

    // Serve static files (index.html, bundle.js)
    const publicDir = path.join(__dirname, '../../');
    app.get('/', (req, res) => {
      res.sendFile(path.join(publicDir, 'index.html'));
    });
    app.get('/bundle.js', (req, res) => {
      res.sendFile(path.join(publicDir, 'build', 'bundle.js'));
    });

    // 404 handler
    app.use((req, res, next) => {
      res.status(404).send('Not found');
    });

    // Error handler
    app.use((err, req, res, next) => {
      logerror(err);
      res.status(500).send('Internal server error');
    });

    // Create HTTP server and attach Socket.io with fixed configuration
    const server = http.createServer(app);
    const io = new SocketIO(server, { 
      cors: { 
        origin: '*', 
        methods: ['GET', 'POST'],
        credentials: false
      },
      transports: ['polling'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Register all socket event handlers
    registerSocketHandlers(io);

    server.listen(port, host, () => {
      loginfo(`tetris listen on ${params.url}`);
      resolve({ stop: (cb) => { io.close(); server.close(cb); } });
    });
    
    server.on('error', (err) => {
      logerror('Server error:', err);
      reject(err);
    });
  });
  return promise;
}

// This file is used by test helpers only - actual tests are in separate files

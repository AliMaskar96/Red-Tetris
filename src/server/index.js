import express from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import debug from 'debug';
import fs from 'fs';
import registerSocketHandlers from './socketHandlers.js';

// ES6 module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // Create HTTP server and attach Socket.io
    const server = http.createServer(app);
    const io = new SocketIO(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

    // Register all socket event handlers
    registerSocketHandlers(io);

    server.listen(port, host, () => {
      loginfo(`tetris listen on ${params.url}`);
      resolve({ stop: (cb) => { io.close(); server.close(cb); } });
    });
  });
  return promise;
}
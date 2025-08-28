# 🚀 Red Tetris - Production Scripts

This document describes the available scripts for building and running Red Tetris in production.

## 📋 Available Scripts

### Production Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Start Production** | `npm start` or `npm run prod` | 🚀 Builds client (if needed) and starts production server |
| **Build Client** | `npm run build` | 🏗️ Build React client for production with smart rebuild detection |
| **Build Client (Direct)** | `npm run build:client` | 📦 Direct webpack build (no smart detection) |

### Development Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Dev Server** | `npm run srv-dev` | 🔧 Start development server with hot reload |
| **Dev Client** | `npm run client-dev` | 🔥 Start webpack dev server for client |

### Testing Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Run Tests** | `npm test` | 🧪 Run Jest tests |
| **Coverage** | `npm run coverage` | 📊 Run tests with coverage report |
| **Linting** | `npm run eslint` | 🔍 Run ESLint on source code |

## 🎯 Production Deployment

### Quick Start
```bash
# Start production server (builds client if needed)
npm start
```

### Manual Build + Start
```bash
# Build client manually
npm run build

# Start server (will skip rebuild since client is up-to-date)
npm start
```

## ✨ Smart Build Features

The production scripts include intelligent build detection:

- **🔍 Change Detection**: Only rebuilds if source files are newer than bundle
- **📊 Build Metrics**: Shows bundle size and build time
- **🔄 Module Switching**: Automatically handles ES6/CommonJS for webpack compatibility
- **🎨 Colored Output**: Clear, colored console messages for better UX
- **⚡ Performance**: Skips unnecessary rebuilds to save time

## 📁 Script Files

- `scripts/start-production.js` - Main production startup script
- `scripts/build-client.js` - Standalone client build script

## 🌐 Server Information

- **Production URL**: `http://localhost:3004/`
- **Multiplayer Format**: `http://localhost:3004/#ROOM[Player]`
- **Health Check**: `http://localhost:3004/health`

## 🛠️ Build Process

1. **Check Dependencies**: Verifies if client files changed
2. **ES6 Toggle**: Temporarily disables ES6 modules for webpack
3. **Webpack Build**: Runs production build with optimization
4. **ES6 Restore**: Re-enables ES6 modules for server
5. **Server Start**: Launches Express server with Socket.io

## 📊 Bundle Information

- **Production Size**: ~291 KB (optimized)
- **Location**: `build/bundle.js`
- **Format**: Minified, production-ready
- **Includes**: React app, Socket.io client, all dependencies

## 🔧 Troubleshooting

### Build Issues
- Ensure all dependencies are installed: `npm install`
- Clear node_modules if needed: `rm -rf node_modules && npm install`

### Server Issues  
- Check if port 3004 is available
- Verify ES6 modules are properly configured in package.json

### Client Issues
- Clear browser cache
- Check browser console for JavaScript errors
- Verify bundle.js is accessible at `/bundle.js`

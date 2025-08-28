#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function getFileModificationTime(filePath) {
  try {
    return fs.statSync(filePath).mtime.getTime();
  } catch (error) {
    return 0;
  }
}

function getDirectoryModificationTime(dirPath) {
  try {
    let latestTime = 0;
    const files = fs.readdirSync(dirPath, { recursive: true });
    
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css'))) {
        latestTime = Math.max(latestTime, stat.mtime.getTime());
      }
    }
    return latestTime;
  } catch (error) {
    return 0;
  }
}

function shouldRebuild() {
  const bundlePath = path.join(__dirname, '../build/bundle.js');
  const srcClientPath = path.join(__dirname, '../src/client');
  const webpackConfigPath = path.join(__dirname, '../webpack.config.js');
  const packageJsonPath = path.join(__dirname, '../package.json');
  
  // If bundle doesn't exist, we need to build
  if (!fs.existsSync(bundlePath)) {
    log('📦 Bundle not found, building...', colors.yellow);
    return true;
  }
  
  const bundleTime = getFileModificationTime(bundlePath);
  const clientTime = getDirectoryModificationTime(srcClientPath);
  const webpackTime = getFileModificationTime(webpackConfigPath);
  const packageTime = getFileModificationTime(packageJsonPath);
  
  // Check if any source files are newer than the bundle
  if (clientTime > bundleTime || webpackTime > bundleTime || packageTime > bundleTime) {
    log('🔄 Client files changed, rebuilding...', colors.yellow);
    return true;
  }
  
  log('✅ Bundle is up to date', colors.green);
  return false;
}

async function buildClient() {
  log('🏗️  Building React client...', colors.blue);
  
  try {
    // Temporarily disable ES6 modules for webpack
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const hasModuleType = packageJson.type === 'module';
    
    if (hasModuleType) {
      delete packageJson.type;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      log('📝 Temporarily disabled ES6 modules for build', colors.cyan);
    }
    
    // Build the client
    const { stdout, stderr } = await execAsync('npm run client-dist');
    
    if (stderr && !stderr.includes('WARNING')) {
      log(`❌ Build warnings/errors: ${stderr}`, colors.yellow);
    }
    
    // Restore ES6 modules
    if (hasModuleType) {
      packageJson.type = 'module';
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      log('📝 Restored ES6 modules configuration', colors.cyan);
    }
    
    log('✅ Client build completed successfully!', colors.green);
    
    // Show bundle size
    const bundlePath = path.join(__dirname, '../build/bundle.js');
    if (fs.existsSync(bundlePath)) {
      const bundleSize = fs.statSync(bundlePath).size;
      const bundleSizeKB = Math.round(bundleSize / 1024);
      log(`📊 Bundle size: ${bundleSizeKB} KB`, colors.cyan);
    }
    
  } catch (error) {
    log(`❌ Build failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

async function startServer() {
  log('🚀 Starting production server...', colors.green);
  
  try {
    // Import and start the server
    const serverModule = await import('../src/server/main.js');
    log('✅ Server started successfully!', colors.bright + colors.green);
    log('🌐 Access your app at: http://localhost:3004/', colors.cyan);
    log('🎮 Multiplayer format: http://localhost:3004/#ROOM[Player]', colors.cyan);
    log('💡 Press Ctrl+C to stop the server', colors.yellow);
    
  } catch (error) {
    log(`❌ Server failed to start: ${error.message}`, colors.red);
    process.exit(1);
  }
}

async function main() {
  log('🎮 Red Tetris - Production Start', colors.bright + colors.magenta);
  log('================================', colors.magenta);
  
  try {
    // Check if we need to rebuild
    if (shouldRebuild()) {
      await buildClient();
    }
    
    // Start the server
    await startServer();
    
  } catch (error) {
    log(`❌ Failed to start: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n👋 Shutting down gracefully...', colors.yellow);
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n👋 Shutting down gracefully...', colors.yellow);
  process.exit(0);
});

// Start the application
main().catch((error) => {
  log(`❌ Unexpected error: ${error.message}`, colors.red);
  process.exit(1);
});

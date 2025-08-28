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
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function buildClient() {
  log('🏗️  Building React client for production...', colors.blue);
  
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
    const startTime = Date.now();
    const { stdout, stderr } = await execAsync('npm run client-dist');
    const buildTime = Date.now() - startTime;
    
    if (stderr && !stderr.includes('WARNING')) {
      log(`❌ Build warnings/errors: ${stderr}`, colors.yellow);
    }
    
    // Restore ES6 modules
    if (hasModuleType) {
      packageJson.type = 'module';
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      log('📝 Restored ES6 modules configuration', colors.cyan);
    }
    
    log(`✅ Client build completed in ${buildTime}ms!`, colors.green);
    
    // Show bundle information
    const bundlePath = path.join(__dirname, '../build/bundle.js');
    if (fs.existsSync(bundlePath)) {
      const bundleSize = fs.statSync(bundlePath).size;
      const bundleSizeKB = Math.round(bundleSize / 1024);
      log(`📊 Bundle size: ${bundleSizeKB} KB`, colors.cyan);
      log(`📂 Bundle location: build/bundle.js`, colors.cyan);
    }
    
  } catch (error) {
    log(`❌ Build failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Start the build
buildClient().catch((error) => {
  log(`❌ Unexpected error: ${error.message}`, colors.red);
  process.exit(1);
});

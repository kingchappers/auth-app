const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure build/api directory exists
const apiBuildDir = path.join(__dirname, '../build/api');
if (!fs.existsSync(apiBuildDir)) {
  fs.mkdirSync(apiBuildDir, { recursive: true });
}

// Compile TypeScript handler to JavaScript
console.log('Compiling API handler...');
execSync(
  'tsc api-handler.ts --outDir build/api --module commonjs --skipLibCheck --target es2020 --resolveJsonModule --esModuleInterop',
  { cwd: path.join(__dirname, '..'), stdio: 'inherit' }
);

// Rename api-handler.js to index.js so Lambda can find it with handler "index.handler"
const apiHandlerPath = path.join(apiBuildDir, 'api-handler.js');
const indexPath = path.join(apiBuildDir, 'index.js');
if (fs.existsSync(apiHandlerPath)) {
  fs.renameSync(apiHandlerPath, indexPath);
}

// Copy only the required node_modules for Lambda
const nodeModulesDir = path.join(__dirname, '../build/api/node_modules');
if (!fs.existsSync(nodeModulesDir)) {
  fs.mkdirSync(nodeModulesDir, { recursive: true });
}

const requiredModules = ['jsonwebtoken', 'jwks-rsa'];
const sourceNodeModules = path.join(__dirname, '../node_modules');

requiredModules.forEach(module => {
  const source = path.join(sourceNodeModules, module);
  const dest = path.join(nodeModulesDir, module);
  if (fs.existsSync(source)) {
    // Copy module recursively
    execSync(`cp -r "${source}" "${dest}"`, { stdio: 'inherit' });
  }
});

console.log('✓ API handler compiled to build/api/index.js');
console.log('✓ Dependencies copied to build/api/node_modules/');

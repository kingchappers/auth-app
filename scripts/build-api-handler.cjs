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
  'tsc api-handler.ts --outDir build/api --module commonjs --skipLibCheck --target es2020 --resolveJsonModule',
  { cwd: path.join(__dirname, '..'), stdio: 'inherit' }
);

// Copy node_modules needed for the Lambda (jsonwebtoken, jwks-rsa)
// In production, you'd use a bundler like esbuild, but for simplicity we'll rely on the full node_modules
console.log('✓ API handler compiled to build/api/');

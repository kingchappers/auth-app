const fs = require('fs');
const path = require('path');

const handlerCode = `const fs = require('fs');
const path = require('path');

exports.handler = async () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: html
  };
};`;

const outputPath = path.join(__dirname, '../build/client/index.js');
fs.writeFileSync(outputPath, handlerCode);
console.log(`✓ Handler injected to ${outputPath}`);

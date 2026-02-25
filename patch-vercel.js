const fs = require('fs');
const path = require('path');

const indexJsPath = path.join(__dirname, 'node_modules', 'vercel', 'dist', 'index.js');
let code = fs.readFileSync(indexJsPath, 'utf8');

// Replace os.userInfo().username with "developer" 
code = code.replace(/os\.userInfo\(\)\.username/g, '"developer"');
code = code.replace(/userInfo\(\)\.username/g, '"developer"');

fs.writeFileSync(indexJsPath, code);
console.log('Patched Vercel CLI');

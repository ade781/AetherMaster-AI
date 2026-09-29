const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkDir(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        checkDir(fullPath);
      }
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      try {
        execSync(`node --check "${fullPath}"`, { stdio: 'pipe' });
      } catch (err) {
        console.error(`Syntax error in ${fullPath}:`, err.message);
        process.exit(1);
      }
    }
  }
}

const rootDir = path.resolve(__dirname, '..');
console.log(`Checking syntax for all JavaScript files in: ${rootDir}...`);
checkDir(rootDir);
console.log('All backend JavaScript files passed syntax verification.');

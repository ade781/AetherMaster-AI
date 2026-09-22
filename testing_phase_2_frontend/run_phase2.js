const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '..', 'frontend');
const distDir = path.join(frontendDir, 'dist');

console.log('============================================');
console.log('   FASE 2: FRONTEND COMPILATION TEST        ');
console.log('============================================');

try {
  console.log('[Test 1] Running Vite Build to verify React components...');
  execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
  
  console.log('\n[Test 2] Verifying build output artifacts...');
  if (fs.existsSync(path.join(distDir, 'index.html'))) {
    console.log('✅ index.html generated successfully.');
  } else {
    throw new Error('index.html is missing in dist folder.');
  }
  
  const assetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(assetsDir) && fs.readdirSync(assetsDir).length > 0) {
    console.log('✅ CSS/JS bundles generated successfully.');
  } else {
    throw new Error('Assets bundle is missing.');
  }

  console.log('\n✅ FASE 2: FRONTEND TESTING BERHASIL SEMPURNA!');
  process.exit(0);
} catch (err) {
  console.error('\n❌ FASE 2 GAGAL:', err.message);
  process.exit(1);
}

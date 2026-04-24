const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { preparePublishPackageJson } = require('./prepare-publish-package.cjs');

// 创建临时发布目录
const tempDir = path.join(__dirname, '..', 'temp-publish');
const distDir = path.join(__dirname, '..', 'dist');
const rootDir = path.join(__dirname, '..');

// 自动更新 CHANGELOG.md
console.log('正在更新 CHANGELOG.md...');
try {
  execSync('node scripts/update-changelog.cjs', { cwd: rootDir, stdio: 'inherit' });
} catch (error) {
  console.error('更新 CHANGELOG.md 失败:', error.message);
  // 可以选择是否中断发布，这里仅警告
}

// 清理临时目录
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

// 复制dist内的所有文件到临时目录根部
function copyDistFiles(src, dest) {
  const items = fs.readdirSync(src);
  
  items.forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDistFiles(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// 复制dist文件
copyDistFiles(distDir, tempDir);

// 复制package.json、LICENSE、README.md
fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(tempDir, 'package.json'));
fs.copyFileSync(path.join(rootDir, 'LICENSE'), path.join(tempDir, 'LICENSE'));
fs.copyFileSync(path.join(rootDir, 'README.md'), path.join(tempDir, 'README.md'));

// 复制 CHANGELOG.md
const changelogSrc = path.join(rootDir, 'CHANGELOG.md');
if (fs.existsSync(changelogSrc)) {
  fs.copyFileSync(changelogSrc, path.join(tempDir, 'CHANGELOG.md'));
}

// 复制 docs 目录
const docsSrc = path.join(rootDir, 'docs');
const docsDest = path.join(tempDir, 'docs');
if (fs.existsSync(docsSrc)) {
  fs.mkdirSync(docsDest, { recursive: true });
  copyDistFiles(docsSrc, docsDest);
}

// 修改临时 package.json 的入口、类型和 exports，匹配扁平发布目录。
const packageJsonPath = path.join(tempDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const publishPackageJson = preparePublishPackageJson(packageJson);
fs.writeFileSync(packageJsonPath, JSON.stringify(publishPackageJson, null, 2));

console.log('准备发布文件完成，临时目录:', tempDir);
console.log('请进入临时目录执行 npm publish');

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 创建临时发布目录
const tempDir = path.join(__dirname, '..', 'temp-publish');
const distDir = path.join(__dirname, '..', 'dist');
const rootDir = path.join(__dirname, '..');

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

// 复制 AI_CONTEXT.md
const aiContextSrc = path.join(rootDir, 'AI_CONTEXT.md');
if (fs.existsSync(aiContextSrc)) {
  fs.copyFileSync(aiContextSrc, path.join(tempDir, 'AI_CONTEXT.md'));
}

// 复制 docs 目录
const docsSrc = path.join(rootDir, 'docs');
const docsDest = path.join(tempDir, 'docs');
if (fs.existsSync(docsSrc)) {
  fs.mkdirSync(docsDest, { recursive: true });
  copyDistFiles(docsSrc, docsDest);
}

// 修改临时package.json的配置
const packageJson = JSON.parse(fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8'));
// 修正main和types路径，因为文件已经在根目录
packageJson.main = "index.js";
packageJson.types = "index.d.ts";
// 确保包含所有必要文件
packageJson.files = [
  "**/*",
  "LICENSE",
  "README.md",
  "AI_CONTEXT.md",
  "docs",
  "package.json"
];
fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));

console.log('准备发布文件完成，临时目录:', tempDir);
console.log('请进入临时目录执行 npm publish');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 构建配置
const config = {
    srcDir: './src',
    distDir: './dist',
    entryFile: './src/index.ts',
    outputFile: './dist/index.js'
};

// 清理输出目录
function cleanDist() {
    console.log('🧹 清理输出目录...');
    if (fs.existsSync(config.distDir)) {
        fs.rmSync(config.distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(config.distDir, { recursive: true });
    console.log('✅ 输出目录已清理');
}

// 编译TypeScript
function compileTypeScript() {
    console.log('🔨 编译TypeScript...');
    try {
        execSync('npx tsc', { stdio: 'inherit' });
        console.log('✅ TypeScript编译完成');
    } catch (error) {
        console.error('❌ TypeScript编译失败:', error.message);
        process.exit(1);
    }
}

// 复制类型定义文件
function copyTypeDefinitions() {
    console.log('📋 复制类型定义文件...');
    try {
        const srcTypesFile = path.join(config.srcDir, 'types.ts');
        const distTypesFile = path.join(config.distDir, 'types.d.ts');
        
        if (fs.existsSync(srcTypesFile)) {
            // 读取types.ts内容并转换为.d.ts格式
            let content = fs.readFileSync(srcTypesFile, 'utf8');
            
            // 移除实现代码，只保留类型定义
            content = content
                .replace(/export\s+const\s+[^;]+;/g, '') // 移除const导出
                .replace(/export\s+function\s+[^{]+\{[^}]*\}/g, '') // 移除函数实现
                .replace(/^\s*$/gm, '') // 移除空行
                .trim();
            
            fs.writeFileSync(distTypesFile, content);
            console.log('✅ 类型定义文件已复制');
        }
    } catch (error) {
        console.warn('⚠️ 复制类型定义文件失败:', error.message);
    }
}

// 生成package.json（如果不存在）
function generatePackageJson() {
    const packageJsonPath = './package.json';
    if (!fs.existsSync(packageJsonPath)) {
        console.log('📦 生成package.json...');
        const packageJson = {
            "name": "my-openlayers",
            "version": "1.0.0",
            "description": "基于OpenLayers的地图工具库",
            "main": "dist/index.js",
            "types": "dist/index.d.ts",
            "scripts": {
                "build": "node build.js",
                "dev": "tsc --watch",
                "test": "echo \"Error: no test specified\" && exit 1"
            },
            "keywords": [
                "openlayers",
                "map",
                "gis",
                "typescript"
            ],
            "author": "",
            "license": "MIT",
            "dependencies": {
                "ol": "^7.5.2"
            },
            "devDependencies": {
                "typescript": "^5.0.0",
                "@types/node": "^20.0.0"
            }
        };
        
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log('✅ package.json已生成');
    }
}

// 生成tsconfig.json（如果不存在）
function generateTsConfig() {
    const tsconfigPath = './tsconfig.json';
    if (!fs.existsSync(tsconfigPath)) {
        console.log('⚙️ 生成tsconfig.json...');
        const tsconfig = {
            "compilerOptions": {
                "target": "ES2020",
                "module": "ESNext",
                "moduleResolution": "node",
                "lib": ["ES2020", "DOM"],
                "outDir": "./dist",
                "rootDir": "./src",
                "strict": true,
                "esModuleInterop": true,
                "skipLibCheck": true,
                "forceConsistentCasingInFileNames": true,
                "declaration": true,
                "declarationMap": true,
                "sourceMap": true,
                "removeComments": false,
                "noImplicitAny": true,
                "noImplicitReturns": true,
                "noUnusedLocals": true,
                "noUnusedParameters": true
            },
            "include": [
                "src/**/*"
            ],
            "exclude": [
                "node_modules",
                "dist",
                "examples"
            ]
        };
        
        fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
        console.log('✅ tsconfig.json已生成');
    }
}

// 主构建流程
function build() {
    console.log('🚀 开始构建 My OpenLayers...');
    console.log('='.repeat(50));
    
    try {
        generatePackageJson();
        generateTsConfig();
        cleanDist();
        compileTypeScript();
        copyTypeDefinitions();
        
        console.log('='.repeat(50));
        console.log('🎉 构建完成！');
        console.log(`📁 输出目录: ${config.distDir}`);
        console.log(`📄 主文件: ${config.outputFile}`);
        console.log('💡 提示: 可以运行 "npm run dev" 开启监听模式');
        
    } catch (error) {
        console.error('❌ 构建失败:', error.message);
        process.exit(1);
    }
}

// 检查是否直接运行此脚本
if (require.main === module) {
    build();
}

module.exports = { build, config };
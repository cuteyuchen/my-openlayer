import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { preparePublishPackageJson } = require('../scripts/prepare-publish-package.cjs');

describe('preparePublishPackageJson', () => {
  it('将发布 package 元数据改为 temp-publish 的扁平目录结构', () => {
    const packageJson = {
      name: 'my-openlayer',
      version: '2.5.0',
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      exports: {
        '.': {
          types: './dist/index.d.ts',
          import: './dist/index.js'
        }
      },
      files: ['dist/**/*', 'LICENSE', 'README.md']
    };

    const result = preparePublishPackageJson(packageJson);

    expect(result.main).toBe('index.js');
    expect(result.types).toBe('index.d.ts');
    expect(result.exports).toEqual({
      '.': {
        types: './index.d.ts',
        import: './index.js'
      }
    });
    expect(result.files).toEqual([
      '**/*',
      'LICENSE',
      'README.md',
      'CHANGELOG.md',
      'docs',
      'package.json'
    ]);
  });
});

function preparePublishPackageJson(packageJson) {
  const publishPackageJson = {
    ...packageJson,
    // temp-publish 会把 dist 内容复制到根目录，入口也必须指向根目录文件。
    main: 'index.js',
    types: 'index.d.ts',
    exports: {
      '.': {
        types: './index.d.ts',
        import: './index.js'
      }
    },
    // 扁平发布目录已经是最终包内容，保留全部生成文件和文档。
    files: [
      '**/*',
      'LICENSE',
      'README.md',
      'CHANGELOG.md',
      'docs',
      'package.json'
    ]
  };

  return publishPackageJson;
}

module.exports = {
  preparePublishPackageJson
};

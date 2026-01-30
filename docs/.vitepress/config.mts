import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/my-openlayer/',
  title: "MyOpenLayer",
  description: "基于 OpenLayers 的现代地图组件库",
  lang: 'zh-CN',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/MyOl' },
      { text: 'API', link: '/MyOl' },
      { text: 'GitHub', link: 'https://github.com/cuteyuchen/my-openlayer' }
    ],

    sidebar: [
      {
        text: '核心类库',
        items: [
          { text: 'MyOl 地图入口', link: '/MyOl' },
          { text: 'MapBaseLayers 底图管理', link: '/MapBaseLayers' },
          { text: 'ConfigManager 配置管理', link: '/ConfigManager' },
          { text: 'EventManager 事件管理', link: '/EventManager' },
          { text: 'ErrorHandler 错误处理', link: '/ErrorHandler' }
        ]
      },
      {
        text: '要素操作',
        items: [
          { text: 'Point 点要素', link: '/Point' },
          { text: 'Line 线要素', link: '/Line' },
          { text: 'Polygon 面要素', link: '/Polygon' },
          { text: 'VueTemplatePoint Vue点位', link: '/VueTemplatePoint' },
          { text: 'RiverLayerManager 河流图层', link: '/RiverLayerManager' }
        ]
      },
      {
        text: '交互与工具',
        items: [
          { text: 'SelectHandler 要素选择', link: '/SelectHandler' },
          { text: 'MeasureHandler 测量工具', link: '/MeasureHandler' },
          { text: 'MapTools 地图工具', link: '/MapTools' },
          { text: 'ValidationUtils 验证工具', link: '/ValidationUtils' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/cuteyuchen/my-openlayer' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present'
    }
  }
})

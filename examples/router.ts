import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

export interface ExampleRoute extends RouteRecordRaw {
  meta: {
    label: string
    group: 'overview' | 'core' | 'map' | 'interaction' | 'projection'
    blurb: string
  }
}

const routes: ExampleRoute[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('./pages/HomePage.vue'),
    meta: { label: '首页', group: 'overview', blurb: '示例总览' }
  },
  {
    path: '/my-ol',
    name: 'my-ol',
    component: () => import('./pages/MyOlPage.vue'),
    meta: { label: 'MyOl', group: 'core', blurb: '构造、destroy、重建' }
  },
  {
    path: '/point',
    name: 'point',
    component: () => import('./pages/PointPage.vue'),
    meta: { label: 'Point', group: 'core', blurb: 'add / cluster / pulse / dom / vue' }
  },
  {
    path: '/line',
    name: 'line',
    component: () => import('./pages/LinePage.vue'),
    meta: { label: 'Line', group: 'core', blurb: 'addLine / FlowLine / ByUrl' }
  },
  {
    path: '/polygon',
    name: 'polygon',
    component: () => import('./pages/PolygonPage.vue'),
    meta: { label: 'Polygon', group: 'core', blurb: 'polygon / mask / heatmap / image' }
  },
  {
    path: '/base-layers',
    name: 'base-layers',
    component: () => import('./pages/MapBaseLayersPage.vue'),
    meta: { label: 'MapBaseLayers', group: 'map', blurb: '底图切换 / 注记' }
  },
  {
    path: '/map-tools',
    name: 'map-tools',
    component: () => import('./pages/MapToolsPage.vue'),
    meta: { label: 'MapTools', group: 'map', blurb: '裁剪 / 定位 / fit' }
  },
  {
    path: '/select-handler',
    name: 'select-handler',
    component: () => import('./pages/SelectHandlerPage.vue'),
    meta: { label: 'SelectHandler', group: 'interaction', blurb: 'click / hover / 编程选择' }
  },
  {
    path: '/event-manager',
    name: 'event-manager',
    component: () => import('./pages/EventManagerPage.vue'),
    meta: { label: 'EventManager', group: 'interaction', blurb: 'on / off / once / filter' }
  },
  {
    path: '/vue-template-point',
    name: 'vue-template-point',
    component: () => import('./pages/VueTemplatePointPage.vue'),
    meta: { label: 'VueTemplatePoint', group: 'interaction', blurb: 'Vue 组件作为点位' }
  },
  {
    path: '/projection-manager',
    name: 'projection-manager',
    component: () => import('./pages/ProjectionManagerPage.vue'),
    meta: { label: 'ProjectionManager', group: 'projection', blurb: '注册自定义 EPSG' }
  }
]

export const navRoutes = routes

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router

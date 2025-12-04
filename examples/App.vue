<template>
  <div id="app">
    <div class="toolbar">
      <button @click="measureDistance">测距</button>
      <button @click="measureArea">测面</button>
      <button @click="clearMeasure">清除</button>
    </div>
    <div id="map" class="map"></div>
  </div>
</template>

<script>
import { MyOl, MeasureHandler } from '../src/index'

export default {
  name: 'App',
  data() {
    return {
      myOl: null,
      measureHandler: null
    }
  },
  mounted() {
    // 使用 import.meta.env 获取 token
    const tiandituToken = import.meta.env.VITE_TIANDITU_TOKEN || 'YOUR_TIANDITU_TOKEN_HERE'
    
    // 初始化地图
    this.myOl = new MyOl('map', {
      token: tiandituToken,
      center: [116.404, 39.915],
      zoom: 10,
      annotation: true // 启用注记
    })

    // 初始化测量工具
    this.measureHandler = new MeasureHandler(this.myOl.map)
  },
  methods: {
    measureDistance() {
      if (this.measureHandler) {
        this.measureHandler.start('LineString')
      }
    },
    measureArea() {
      if (this.measureHandler) {
        this.measureHandler.start('Polygon')
      }
    },
    clearMeasure() {
      if (this.measureHandler) {
        this.measureHandler.clean()
      }
    }
  }
}
</script>

<style>
.map {
  width: 100%;
  height: 100%;
}
.toolbar {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  background: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}
.toolbar button {
  margin-left: 10px;
  padding: 5px 15px;
  cursor: pointer;
}
.toolbar button:first-child {
  margin-left: 0;
}
</style>
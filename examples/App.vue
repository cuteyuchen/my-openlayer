<template>
  <div id="app">
    <div id="map" class="map"></div>
  </div>
</template>

<script>
// 使用 import.meta.env 获取天地图 token（Vite 推荐方式）
import { Map, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import { XYZ } from 'ol/source'
import { fromLonLat } from 'ol/proj'

export default {
  name: 'App',
  mounted() {
    // 使用 import.meta.env 获取 token，如果没有则使用占位符
    const tiandituToken = import.meta.env.VITE_TIANDITU_TOKEN || 'YOUR_TIANDITU_TOKEN_HERE'
    
    const map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new XYZ({
            url: `http://t0.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tiandituToken}`
          })
        }),
        new TileLayer({
          source: new XYZ({
            url: `http://t0.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tiandituToken}`
          })
        })
      ],
      view: new View({
        center: fromLonLat([116.404, 39.915]),
        zoom: 10
      })
    })
  }
}
</script>

<style>
.map {
  width: 100%;
  height: 100%;
}
</style>
<script setup lang="ts">
import MyOl from "../src/index";
import { onMounted } from "vue";
import { Tile as TileLayer } from "ol/layer";
import XYZ from "ol/source/XYZ";

onMounted(() => {
  const myOL = new MyOl('myMap', {
    center: [119.85, 30],
    zoom: 10.8,
    layers: [new TileLayer({
      source: new XYZ({
        url: 'http://t{0-7}.tianditu.gov.cn/DataServer?T=vec_c&tk=********************&x={x}&y={y}&l={z}',
        projection: 'EPSG:4326'
      }),
    }),
      //   new TileLayer({
      //   source: new XYZ({
      //     url: 'http://t{0-7}.tianditu.gov.cn/DataServer?T=cva_c&tk=********************&x={x}&y={y}&l={z}',
      //     projection: 'EPSG:4326'
      //   }),
      // })
    ],
    token: '********************',
    annotation: true,
  })
  myOL.getMapBaseLayers().addAnnotationLayer({
    type: 'cia_c',
  })
})
</script>

<template>
  <div id="myMap"></div>
</template>

<style scoped>
#myMap {
  width: 100%;
  height: 100%;
  background-color: #f0f0f0;
}
</style>

<template>
  <div class="large-polygon-test-container">
    <div class="component-toolbar">
      <button @click="testLargePolygon" :disabled="loading">
        {{ loading ? '加载中...' : '测试大文件面' }}
      </button>
    </div>
    <div ref="mapContainer" class="map-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, shallowRef } from 'vue'
import { MyOl } from '../../src/index'

const mapContainer = ref<HTMLElement | null>(null)
const myOlInstance = shallowRef<MyOl | null>(null)
const loading = ref(false)

// 使用 import.meta.env 获取 token
const tiandituToken = (import.meta as any).env?.VITE_TIANDITU_TOKEN || 'YOUR_TIANDITU_TOKEN_HERE'

onMounted(() => {
  if (mapContainer.value) {
    initMap(mapContainer.value)
  }
})

const initMap = (target: HTMLElement) => {
  if (myOlInstance.value) {
    myOlInstance.value.destroy()
    myOlInstance.value = null
    target.innerHTML = '' // 确保容器清空
  }
  const newMyOl = new MyOl(target, {
    token: tiandituToken,
    center: [109.030378, 33.944369],
    zoom: 8,
    annotation: true,
  })
  myOlInstance.value = newMyOl
}

const testLargePolygon = () => {
  if (mapContainer.value) {
     initMap(mapContainer.value)
     runLargePolygonTest()
  }
}

const runLargePolygonTest = () => {
  const myOl = myOlInstance.value
  if (!myOl) return

  console.log('Testing large polygon file...')
  loading.value = true
  
  try {
    const polygon = myOl.getPolygon()
    const layerName = 'gridLayer'

    // 使用 addPolygonByUrl 加载数据
    const layer = polygon.addPolygonByUrl('/grid.json', {
      layerName: layerName,
      withDefaultFill:false,
      withDefaultStroke:false,
    })

    const source = layer.getSource()
    if (!source) {
      loading.value = false
      return
    }

    // 监听加载完成事件
    source.once('featuresloadend', () => {
      try {
        const features = source.getFeatures()
        const totalFeatures = features.length
        
        // 随机选择 5000 个面
        const sampleSize = 5000
        const selectedIndices = new Set<number>()

        if (totalFeatures <= sampleSize) {
          for (let i = 0; i < totalFeatures; i++) {
            selectedIndices.add(i)
          }
        } else {
          while (selectedIndices.size < sampleSize) {
            const randomIndex = Math.floor(Math.random() * totalFeatures)
            selectedIndices.add(randomIndex)
          }
        }

        // 构建颜色映射对象 { ID: color }
        const colorObj: { [key: string]: string } = {}
        const idKey = 'ID' // grid.json 中的唯一标识字段

        selectedIndices.forEach(index => {
          const feature = features[index]
          const id = feature.get(idKey)
          if (id) {
            const r = Math.floor(Math.random() * 256)
            const g = Math.floor(Math.random() * 256)
            const b = Math.floor(Math.random() * 256)
            colorObj[id] = `rgba(${r}, ${g}, ${b}, 1)`
          }
        })

        // 使用 updateFeatureColor 更新颜色
        polygon.updateFeatureColor(layerName, colorObj, {
          textKey: idKey,
          withDefaultFill:false,
          withDefaultStroke:false,
        })
        
      } catch (error) {
        console.error('Error processing features:', error)
      } finally {
        loading.value = false
      }
    })

    source.once('featuresloaderror', () => {
      console.error('Failed to load grid.json')
      loading.value = false
      alert('加载数据失败，请检查网络或文件路径')
    })
    
  } catch (error) {
    console.error('Failed to init grid layer:', error)
    loading.value = false
  }
}
</script>

<style scoped>
.large-polygon-test-container {
  width: 100%;
  height: 100%;
  position: relative;
}
button {
  padding: 5px 15px;
  cursor: pointer;
}
</style>

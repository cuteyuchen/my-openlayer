<template>
  <div class="select-test-container">
    <div class="control-panel">
      <h3>SelectHandler 测试</h3>
      
      <div class="control-group">
        <h4>交互模式</h4>
        <div class="button-row">
          <button @click="enableClickSelect" :class="{ active: currentMode === 'click' && isEnabled }">点击选择</button>
          <button @click="enableHoverSelect" :class="{ active: currentMode === 'hover' && isEnabled }">悬停选择</button>
          <button @click="disableSelect" :class="{ active: !isEnabled }">禁用</button>
        </div>
        <div class="option-row">
          <label>
            <input type="checkbox" v-model="isMulti" @change="onOptionChange" /> 允许对选
          </label>
        </div>
      </div>

      <div class="control-group">
        <h4>编程式选择</h4>
        <div class="button-row">
          <button @click="selectPointById">选点(ID: point1)</button>
          <button @click="selectLineById">选线(ID: line1)</button>
        </div>
        <div class="button-row">
          <button @click="selectByPropTypeA">选属性(type=A)</button>
          <button @click="selectByPropTypePolygon">选属性(type=B)</button>
        </div>
        <div class="button-row">
          <button @click="selectWithCustomStyle">自定义样式选择(绿色)</button>
          <button @click="clearSelection">清除选择</button>
        </div>
      </div>

      <div class="control-group">
        <h4>样式更新</h4>
        <div class="button-row">
          <button @click="updateStyleBlue">更新为蓝色</button>
          <button @click="updateStyleRed">更新为红色(默认)</button>
          <button @click="updatePolygonStroke">仅修改面边框(黄色)</button>
        </div>
      </div>

      <div class="status-panel">
        <h4>当前状态</h4>
        <p><strong>启用状态:</strong> {{ isEnabled ? '已启用' : '已禁用' }}</p>
        <p><strong>当前模式:</strong> {{ currentMode || '无' }}</p>
        <p><strong>选中数量:</strong> {{ selectedCount }}</p>
        <p><strong>选中ID:</strong> {{ selectedIds.join(', ') || '无' }}</p>
      </div>
    </div>
    <div ref="mapContainer" class="map-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, shallowRef, onBeforeUnmount } from 'vue'
import { MyOl, SelectHandler } from '../../src/index'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature, { FeatureLike } from 'ol/Feature'
import { Point, LineString, Polygon } from 'ol/geom'
import { Style, Circle as CircleStyle, Fill, Stroke } from 'ol/style'

const mapContainer = ref<HTMLElement | null>(null)
const myOlInstance = shallowRef<MyOl | null>(null)
const selectHandler = shallowRef<SelectHandler | null>(null)

// 状态响应式数据
const isEnabled = ref(false)
const currentMode = ref<string | undefined>(undefined)
const isMulti = ref(true)
const selectedCount = ref(0)
const selectedIds = ref<string[]>([])

// 使用 import.meta.env 获取 token
const tiandituToken = (import.meta as any).env?.VITE_TIANDITU_TOKEN || 'YOUR_TIANDITU_TOKEN_HERE'

onMounted(() => {
  if (mapContainer.value) {
    initMap(mapContainer.value)
  }
})

onBeforeUnmount(() => {
  if (selectHandler.value) {
    selectHandler.value.destroy()
  }
})

const initMap = (target: HTMLElement) => {
  // 初始化地图
  const newMyOl = new MyOl(target, {
    token: tiandituToken,
    center: [108.940174, 34.341568], // 西安市中心
    zoom: 12,
    // annotation: true,
  })
  myOlInstance.value = newMyOl

  // 添加测试数据
  addTestData(newMyOl.map)

  // 初始化 SelectHandler
  const handler = new SelectHandler(newMyOl.map)
  selectHandler.value = handler
  
  // 初始状态更新
  updateStatus()
}

const addTestData = (map: any) => {
  // 创建矢量源
  const source = new VectorSource()

  // 点1 (type=A) - 钟楼附近
  const point1 = new Feature({
    geometry: new Point([108.940174, 34.261568]),
    type: 'A',
    name: 'Point A (钟楼)'
  })
  point1.setId('point1')
  point1.setStyle(new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({ color: 'blue' }),
      stroke: new Stroke({ color: 'white', width: 2 })
    })
  }))

  // 点2 (type=B) - 大雁塔附近
  const point2 = new Feature({
    geometry: new Point([108.964174, 34.218568]),
    type: 'B',
    name: 'Point B (大雁塔)'
  })
  point2.setId('point2')
  point2.setStyle(new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({ color: 'orange' }),
      stroke: new Stroke({ color: 'white', width: 2 })
    })
  }))

  // 线1 (type=A) - 连接钟楼和大雁塔的线
  const line1 = new Feature({
    geometry: new LineString([[108.940174, 34.261568], [108.964174, 34.218568]]),
    type: 'A',
    name: 'Line A (连接线)'
  })
  line1.setId('line1')
  line1.setStyle(new Style({
    stroke: new Stroke({ color: 'green', width: 3 })
  }))

  // 面1 (type=B) - 大明宫遗址公园附近区域
  const polygon1 = new Feature({
    geometry: new Polygon([[
      [108.948174, 34.296568], 
      [108.968174, 34.296568], 
      [108.968174, 34.281568], 
      [108.948174, 34.281568], 
      [108.948174, 34.296568]
    ]]),
    type: 'Polygon',
    name: 'Polygon B (大明宫)'
  })
  polygon1.setId('polygon1')
  polygon1.setStyle(new Style({
    stroke: new Stroke({ color: 'purple', width: 2 }),
    fill: new Fill({ color: 'rgba(128, 0, 128, 0.2)' })
  }))

  source.addFeatures([point1, point2, line1, polygon1])

  const vectorLayer = new VectorLayer({
    source: source,
    properties: {
      layerName: 'testLayer'
    },
    zIndex: 20 // 确保在底图之上
  })

  map.addLayer(vectorLayer)
}

// 状态更新辅助函数
const updateStatus = () => {
  if (!selectHandler.value) return
  
  isEnabled.value = selectHandler.value.isSelectEnabled()
  currentMode.value = selectHandler.value.getCurrentMode()
  
  const features = selectHandler.value.getSelectedFeatures()
  selectedCount.value = features.length
  selectedIds.value = features.map(f => {
    const id = f.getId()
    return id ? id.toString() : 'unknown'
  })
}

// 事件回调
const onSelectCallback = (event: any) => {
  console.log('选中:', event.selected)
  updateStatus()
}

const onDeselectCallback = (event: any) => {
  console.log('取消选中:', event.deselected)
  updateStatus()
}

// --- 功能方法 ---

const enableClickSelect = () => {
  if (!selectHandler.value) return
  selectHandler.value.enableSelect('click', {
    multi: isMulti.value,
    onSelect: onSelectCallback,
    onDeselect: onDeselectCallback
  })
  updateStatus()
}

const enableHoverSelect = () => {
  if (!selectHandler.value) return
  selectHandler.value.enableSelect('hover', {
    multi: isMulti.value,
    onSelect: onSelectCallback,
    onDeselect: onDeselectCallback
  })
  updateStatus()
}

const disableSelect = () => {
  if (!selectHandler.value) return
  selectHandler.value.disableSelect()
  updateStatus()
}

const onOptionChange = () => {
  // 如果当前已启用，重新启用以应用新选项
  if (isEnabled.value && currentMode.value) {
    if (currentMode.value === 'click') enableClickSelect()
    if (currentMode.value === 'hover') enableHoverSelect()
  }
}

const clearSelection = () => {
  if (!selectHandler.value) return
  selectHandler.value.clearSelection()
  updateStatus()
}

const selectPointById = () => {
  if (!selectHandler.value) return
  selectHandler.value.selectByIds(['point1'], {
    fitView: true,
    selectStyle: undefined // 使用默认样式
  })
  updateStatus()
}

const selectLineById = () => {
  if (!selectHandler.value) return
  selectHandler.value.selectByIds(['line1'], {
    fitView: true
  })
  updateStatus()
}

const selectByPropTypeA = () => {
  if (!selectHandler.value) return
  selectHandler.value.selectByProperty('type', 'A', {
    fitView: true,
    selectStyle: (feature: FeatureLike) => {
      console.log(feature)
      let originStyle: Style | Style[]
      const styleLike = (feature as any).getStyle()
      
      if (typeof styleLike === 'function') {
        originStyle = styleLike(feature)
      } else {
        originStyle = styleLike
      }

      // 处理样式数组或单个样式对象
      const style = Array.isArray(originStyle) ? originStyle[0].clone() : originStyle.clone()
      
      const stroke = style.getStroke()
      if (stroke) {
        stroke.setColor('#00FFFF')
      } else {
        style.setStroke(
          new Stroke({
            color: '#00FFFF',
            width: 3
          })
        )
      }
      return style
    }
  })
  updateStatus()
}

const selectByPropTypePolygon = () => {
  console.log('selectByPropTypePolygon')
  if (!selectHandler.value) return
  selectHandler.value.selectByProperty('type', 'Polygon', {
    fitView: true,
    selectStyle: (feature: FeatureLike) => {
      console.log(feature)
      let originStyle: Style | Style[]
      const styleLike = (feature as any).getStyle()
      
      if (typeof styleLike === 'function') {
        originStyle = styleLike(feature)
      } else {
        originStyle = styleLike
      }
      console.log(originStyle)
      // 处理样式数组或单个样式对象
      const style = Array.isArray(originStyle) ? originStyle[0].clone() : originStyle.clone()
      
      const stroke = style.getStroke()
      if (stroke) {
        stroke.setColor('#00FFFF')
      } else {
        style.setStroke(
          new Stroke({
            color: '#00FFFF',
            width: 3
          })
        )
      }
      console.log(style)
      return style
    }
  })
  updateStatus()
}

const selectWithCustomStyle = () => {
  if (!selectHandler.value) return
  
  // 自定义绿色样式
  const greenStyle = new Style({
    image: new CircleStyle({
      radius: 10,
      fill: new Fill({ color: 'rgba(0, 255, 0, 0.5)' }),
      stroke: new Stroke({ color: 'green', width: 2 })
    }),
    stroke: new Stroke({
      color: 'green',
      width: 4
    }),
    fill: new Fill({
      color: 'rgba(0, 255, 0, 0.3)'
    })
  })

  selectHandler.value.selectByIds(['point1', 'polygon1'], {
    fitView: true,
    selectStyle: greenStyle
  })
  updateStatus()
}

const updateStyleBlue = () => {
  if (!selectHandler.value) return
  
  const blueStyle = new Style({
    image: new CircleStyle({
      radius: 8,
      fill: new Fill({ color: 'rgba(0, 0, 255, 0.6)' }),
      stroke: new Stroke({ color: 'blue', width: 2 })
    }),
    stroke: new Stroke({
      color: 'blue',
      width: 3
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 255, 0.2)'
    })
  })
  
  selectHandler.value.updateSelectStyle(blueStyle)
}

const updateStyleRed = () => {
  if (!selectHandler.value) return
  // 传 undefined 会恢复默认样式吗？或者我们需要手动传入默认样式的逻辑？
  // 这里的实现是传入 undefined 并不会重置为内部默认，因为 updateSelectStyle 只是设置 dynamicSelectStyle
  // 如果我们想恢复默认，可能需要传入 null 或者在 SelectHandler 中处理 undefined
  // 我们可以手动定义一个红色样式来模拟恢复默认
  
  const redStyle = new Style({
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({ color: 'rgba(255, 0, 0, 0.6)' }),
      stroke: new Stroke({ color: 'red', width: 2 })
    }),
    stroke: new Stroke({
      color: 'red',
      width: 3
    }),
    fill: new Fill({
      color: 'rgba(255, 0, 0, 0.2)'
    })
  })

  selectHandler.value.updateSelectStyle(redStyle)
}

const updatePolygonStroke = () => {
  if (!selectHandler.value) return

  const strokeStyle = (feature: any, resolution: number) => {
    // 手动重建原始样式的逻辑（模拟获取原始样式），因为我们无法从已修改的 feature 中安全获取
    // 模拟获取原始样式（基于我们知道的逻辑）
    // 面1 (type=B)
    const originalStyle = new Style({
      stroke: new Stroke({ color: 'purple', width: 2 }),
      fill: new Fill({ color: 'rgba(128, 0, 128, 0.2)' })
    })
    
    const clone = originalStyle.clone()
    const geometry = feature.getGeometry()
    if (geometry instanceof Polygon) {
      clone.setStroke(new Stroke({
        color: 'yellow',
        width: 5
      }))
    }
    return clone
  }

  selectHandler.value.updateSelectStyle(strokeStyle)
}

</script>

<style scoped>
.select-test-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
}

.control-panel {
  width: 300px;
  background: #f5f5f5;
  padding: 15px;
  border-right: 1px solid #ddd;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.map-container {
  flex: 1;
  position: relative;
}

.control-group {
  background: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.control-group h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.button-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

button {
  padding: 6px 10px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 12px;
  transition: all 0.2s;
}

button:hover {
  background: #f0f0f0;
  border-color: #bbb;
}

button.active {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.status-panel {
  background: #e6f7ff;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #91d5ff;
}

.status-panel h4 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 14px;
}

.status-panel p {
  margin: 4px 0;
  font-size: 12px;
  color: #555;
}
</style>

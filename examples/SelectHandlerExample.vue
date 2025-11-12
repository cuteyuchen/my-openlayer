<template>
  <div class="select-example">
    <div id="map" class="map-container"></div>
    
    <div class="control-panel">
      <h3>要素选择功能示例</h3>
      
      <div class="control-group">
        <h4>选择模式</h4>
        <button @click="enableClickSelect">点击选择</button>
        <button @click="enableHoverSelect">悬停选择</button>
        <button @click="enableCtrlSelect">Ctrl+点击选择</button>
        <button @click="disableSelect">禁用选择</button>
      </div>

      <div class="control-group">
        <h4>选择操作</h4>
        <button @click="clearSelection">清除选择</button>
        <button @click="selectById">按ID选择（默认样式）</button>
        <button @click="selectByIdWithStyle">按ID选择（自定义样式）</button>
        <button @click="selectByIdWithFit">按ID选择+定位</button>
        <button @click="selectByProperty">按属性选择（默认样式）</button>
        <button @click="selectByPropertyWithStyle">按属性选择（自定义样式）</button>
        <button @click="selectByPropertyWithFit">按属性选择+定位</button>
      </div>

      <div class="control-group">
        <h4>选中信息</h4>
        <div class="selected-info">
          <p>已选中要素数量: {{ selectedCount }}</p>
          <div v-if="selectedFeatures.length > 0">
            <p>选中要素详情:</p>
            <ul>
              <li v-for="(feature, index) in selectedFeatures" :key="index">
                类型: {{ feature.type }}, ID: {{ feature.id }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import MyOl from '../src/MyOl';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';

const selectedCount = ref(0);
const selectedFeatures = ref<any[]>([]);
let myMap: MyOl | null = null;

onMounted(() => {
  // 初始化地图
  myMap = new MyOl('map', {
    center: [119.81, 29.969],
    zoom: 10
  });

  // 添加一些测试数据
  addTestData();
});

onUnmounted(() => {
  if (myMap) {
    myMap.destroy();
  }
});

// 添加测试数据
function addTestData() {
  if (!myMap) return;

  // 添加点要素
  const pointData = [
    { lgtd: 119.80, lttd: 29.97, name: '点位1', id: 'point1' },
    { lgtd: 119.82, lttd: 29.96, name: '点位2', id: 'point2' },
    { lgtd: 119.79, lttd: 29.98, name: '点位3', id: 'point3' }
  ];

  myMap.getPoint().addPoint(pointData, {
    layerName: 'testPoints',
    textKey: 'name'
  });

  // 添加多边形
  const polygonData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: '区域1', id: 'polygon1' },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [119.75, 29.95],
            [119.77, 29.95],
            [119.77, 29.97],
            [119.75, 29.97],
            [119.75, 29.95]
          ]]
        }
      }
    ]
  };

  myMap.getPolygon().addPolygon(polygonData, {
    layerName: 'testPolygons',
    textKey: 'name',
    textVisible: true
  });
}

// 启用点击选择
function enableClickSelect() {
  if (!myMap) return;

  myMap.getSelectHandler().enableSelect('click', {
    multi: false,
    onSelect: (event) => {
      console.log('选中要素:', event.selected);
      updateSelectedInfo();
    },
    onDeselect: (event) => {
      console.log('取消选中:', event.deselected);
      updateSelectedInfo();
    }
  });

  console.log('点击选择已启用');
}

// 启用悬停选择
function enableHoverSelect() {
  if (!myMap) return;

  myMap.getSelectHandler().enableSelect('hover', {
    multi: false,
    onSelect: (event) => {
      updateSelectedInfo();
    }
  });

  console.log('悬停选择已启用');
}

// 启用Ctrl+点击选择（多选）
function enableCtrlSelect() {
  if (!myMap) return;

  myMap.getSelectHandler().enableSelect('ctrl', {
    multi: true,
    onSelect: (event) => {
      updateSelectedInfo();
    }
  });

  console.log('Ctrl+点击选择已启用');
}

// 禁用选择
function disableSelect() {
  if (!myMap) return;

  myMap.getSelectHandler().disableSelect();
  selectedCount.value = 0;
  selectedFeatures.value = [];
  console.log('选择已禁用');
}

// 清除选择
function clearSelection() {
  if (!myMap) return;

  myMap.getSelectHandler().clearSelection();
  updateSelectedInfo();
  console.log('选择已清除');
}

// 按ID选择（默认样式）
function selectById() {
  if (!myMap) return;

  myMap.getSelectHandler().selectByIds(['point1', 'point2']);
  updateSelectedInfo();
  console.log('已按ID选择要素（使用默认样式）');
}

// 按ID选择（自定义样式）
function selectByIdWithStyle() {
  if (!myMap) return;

  const customStyle = new Style({
    image: new CircleStyle({
      radius: 10,
      fill: new Fill({ color: 'rgba(0, 255, 0, 0.8)' }),
      stroke: new Stroke({ color: '#00ff00', width: 3 })
    })
  });

  myMap.getSelectHandler().selectByIds(['point1', 'point2'], {
    selectStyle: customStyle
  });
  updateSelectedInfo();
  console.log('已按ID选择要素（使用自定义绿色样式）');
}

// 按ID选择+定位
function selectByIdWithFit() {
  if (!myMap) return;

  const customStyle = new Style({
    image: new CircleStyle({
      radius: 12,
      fill: new Fill({ color: 'rgba(255, 0, 255, 0.8)' }),
      stroke: new Stroke({ color: '#ff00ff', width: 4 })
    })
  });

  myMap.getSelectHandler().selectByIds(['point1', 'point2'], {
    selectStyle: customStyle,
    fitView: true,
    fitDuration: 1000,
    fitPadding: 150
  });
  updateSelectedInfo();
  console.log('已按ID选择要素并定位（使用自定义紫色样式）');
}

// 按属性选择（默认样式）
function selectByProperty() {
  if (!myMap) return;

  myMap.getSelectHandler().selectByProperty('name', '点位1');
  updateSelectedInfo();
  console.log('已按属性选择要素（使用默认样式）');
}

// 按属性选择（自定义样式）
function selectByPropertyWithStyle() {
  if (!myMap) return;

  const customStyle = new Style({
    image: new CircleStyle({
      radius: 12,
      fill: new Fill({ color: 'rgba(255, 165, 0, 0.8)' }),
      stroke: new Stroke({ color: '#ff9900', width: 4 })
    })
  });

  myMap.getSelectHandler().selectByProperty('name', '点位1', {
    selectStyle: customStyle
  });
  updateSelectedInfo();
  console.log('已按属性选择要素（使用自定义橙色样式）');
}

// 按属性选择+定位
function selectByPropertyWithFit() {
  if (!myMap) return;

  const customStyle = new Style({
    image: new CircleStyle({
      radius: 14,
      fill: new Fill({ color: 'rgba(0, 255, 255, 0.8)' }),
      stroke: new Stroke({ color: '#00ffff', width: 4 })
    })
  });

  myMap.getSelectHandler().selectByProperty('name', '点位3', {
    selectStyle: customStyle,
    fitView: true,
    fitDuration: 800,
    fitPadding: 120
  });
  updateSelectedInfo();
  console.log('已按属性选择要素并定位（使用自定义青色样式）');
}

// 更新选中信息
function updateSelectedInfo() {
  if (!myMap) return;

  const features = myMap.getSelectHandler().getSelectedFeatures();
  selectedCount.value = features.length;
  
  selectedFeatures.value = features.map((feature: any) => ({
    type: feature.get('type') || '未知',
    id: feature.getId() || feature.get('id') || '无ID',
    name: feature.get('name') || '无名称'
  }));
}
</script>

<style scoped>
.select-example {
  display: flex;
  height: 100vh;
  width: 100vw;
}

.map-container {
  flex: 1;
  height: 100%;
}

.control-panel {
  width: 300px;
  padding: 20px;
  background-color: #f5f5f5;
  overflow-y: auto;
}

.control-panel h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.control-group {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ddd;
}

.control-group:last-child {
  border-bottom: none;
}

.control-group h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #666;
  font-size: 14px;
}

button {
  display: block;
  width: 100%;
  margin-bottom: 10px;
  padding: 8px 16px;
  background-color: #409EFF;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #66b1ff;
}

button:active {
  background-color: #3a8ee6;
}

.selected-info {
  background-color: white;
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
}

.selected-info p {
  margin: 5px 0;
}

.selected-info ul {
  margin: 5px 0;
  padding-left: 20px;
}

.selected-info li {
  margin: 5px 0;
  font-size: 12px;
  color: #666;
}
</style>

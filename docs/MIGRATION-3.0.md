# my-openlayer 3.0 迁移指南

3.0 在保持向后兼容的前提下完成了一次系统性的 API 改造。**绝大多数 2.x 代码不改一行就能跑**，但你会看到一些 `@deprecated` 警告，并能享受到新的统一 API、Promise 异步、运行时配置覆盖等能力。本指南分三段：

1. **必须改的**（编译错误）
2. **推荐改的**（用新 API 写新代码）
3. **保留旧 API 的期限**

---

## 1. 必须改的（编译错误）

### 1.1 `layerName` 在公开 `add*` 签名上变成必填

所有 `Point.addPoint / addClusterPoint / addPulsePointLayer`、`Line.addLine / addLineByUrl / addFlowLine / addFlowLineByUrl`、`Polygon.addPolygon / addPolygonByUrl` 现在要求 `options.layerName` 是 `string`（不再可选）。

```ts
// ❌ 2.x：layerName 可选，遗忘时取 ConfigManager 默认值 'lineLayer'
line.addLine(data)
line.addLine(data, { strokeColor: 'red' })

// ✅ 3.0：必须传 layerName
line.addLine(data, { layerName: 'my-line' })
line.addLine(data, { layerName: 'my-line', strokeColor: 'red' })
```

> **为什么**：依赖默认 `layerName` 的两次调用会互相覆盖，是 2.x 最常见的"图层莫名消失"陷阱。

`PointOptions / LineOptions / PolygonOptions` interface **本身**没改（`layerName?: string` 仍然可选），所以已有的工厂函数、配置对象不受影响 —— 只是公开方法签名收紧了。

### 1.2 移除的旧 API

无。3.0 没有删除任何 2.x API，全部 `@deprecated` 而非删除。

---

## 2. 推荐改的（用新 API 写新代码）

### 2.1 用 `attach*` 替代 `add*` 拿统一句柄

新代码推荐统一用 `attach*` 系列：

```ts
import type { LayerHandle } from 'my-openlayer'

// 跨 Point / Line / Polygon 一致的形态
const pointHandle: LayerHandle | null = myOl.getPoint().attachPoint(data, { layerName: 'p1' })
const lineHandle:  LayerHandle        = myOl.getLine().attachLine(data, { layerName: 'l1' })
const polyHandle:  LayerHandle        = myOl.getPolygon().attachPolygon(data, { layerName: 'r1' })

// 统一生命周期
pointHandle?.setVisible(false)
pointHandle?.remove()
```

动画句柄（`PulsePointLayerHandle` / `FlowLineLayerHandle`）现在显式继承 `AnimatedLayerHandle`：

```ts
import type { AnimatedLayerHandle } from 'my-openlayer'

const flowHandle: AnimatedLayerHandle | null = myOl.getLine().attachFlowLine(data, { layerName: 'flow' })
flowHandle?.start()
flowHandle?.pause?.()
flowHandle?.remove()
```

### 2.2 用 `*ByUrlAsync` 替代 `*ByUrl` 拿 Promise

旧的 `*ByUrl` 同步返回 layer，但 features 仍在异步加载，导致 `fitView` 经常失败、`getFeatures().length === 0`。3.0 新增 Promise 版本：

```ts
// ❌ 2.x：返回 layer 时 features 还在路上
const layer = polygon.addPolygonByUrl('/boundary.geojson', { layerName: 'b' })
// layer.getSource().getFeatures().length === 0  ← 经常踩坑

// ✅ 3.0：features 加载完成后才 resolve
const layer = await polygon.addPolygonByUrlAsync('/boundary.geojson', { layerName: 'b' })
console.log(layer.getSource().getFeatures().length) // 准确
```

同理 `Line.addLineByUrlAsync`。`Line.addFlowLineByUrl` 早就是 Promise，行为不变。

### 2.3 Point 新增 `*ByUrl` Promise API

之前 `Point` 没有任何 `*ByUrl` 方法，必须自己 `fetch + addPoint`。3.0 补齐：

```ts
// 从 URL 加载点位（自动识别 PointData[] 数组或 GeoJSON FeatureCollection）
const layer = await myOl.getPoint().addPointByUrl('/points.json', { layerName: 'p1' })

const handle = await myOl.getPoint().addPulsePointLayerByUrl('/villages.json', {
  layerName: 'villages',
  pulse: { enabled: true, frameCount: 24 }
})
```

### 2.4 投影注册抽到 `ProjectionManager`

2.x 用 `options.projection` 注册自定义投影。3.0 仍然支持，**外加**一个独立入口：

```ts
import { ProjectionManager } from 'my-openlayer'

// 应用启动时一次性注册自定义 EPSG
ProjectionManager.register({
  code: 'EPSG:2380',
  def: '+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=500000 +y_0=0 +ellps=WGS84 +units=m +no_defs'
  // units 省略时由 proj4 自动推导
})

// 之后任何 new MyOl({ projection: { code: 'EPSG:2380' } }) 都能直接用
```

### 2.5 `ConfigManager.setDefaults` 全局覆盖默认值

```ts
import { ConfigManager } from 'my-openlayer'

// 应用启动时把所有线的默认宽度改成 3px
ConfigManager.setDefaults('LINE_OPTIONS', { strokeWidth: 3 })

// 嵌套对象深合并
ConfigManager.setDefaults('FLOW_LINE_OPTIONS', {
  flowSymbol: { scale: 1.2 }  // 其它 flowSymbol 字段保持原默认
})

// 测试结束后重置
ConfigManager.resetDefaults()              // 全部
ConfigManager.resetDefaults('LINE_OPTIONS') // 单组
```

所有现有 `add*` 方法都通过 `ConfigManager.DEFAULT_X` getter 读默认值，因此 `setDefaults` **立即对所有后续调用生效**，不需要改任何业务代码。

### 2.6 `PulsePointIconOptions.src` → `img`

为了和 `PointOptions.img` 命名统一：

```ts
// ❌ 2.x（仍可用，但 @deprecated）
point.addPulsePointLayer(data, {
  layerName: 'p',
  icon: { src: '/icon.svg', scale: 0.8 }
})

// ✅ 3.0
point.addPulsePointLayer(data, {
  layerName: 'p',
  icon: { img: '/icon.svg', scale: 0.8 }
})
```

PointPulseLayer 同时识别 `img` 和 `src`，平滑过渡。

### 2.7 用具体错误类型做精细化处理

```ts
import { LayerNotFoundError, InvalidGeoJSONError, ProjectionError } from 'my-openlayer'

try {
  polygon.updateFeatureColor('nonexistent', { /* ... */ })
} catch (e) {
  if (e instanceof LayerNotFoundError) {
    // 友好提示
    showToast(`图层 "${e.context.layerName}" 不存在，请先调用 addPolygon`)
  } else if (e instanceof InvalidGeoJSONError) {
    showToast('GeoJSON 数据格式有误')
  } else {
    throw e
  }
}
```

---

## 3. 保留旧 API 的期限

下列旧 API 在 3.0 标了 `@deprecated`，**3.x 整个生命周期都仍然可用**，但 3.x 末尾（4.0）会移除。建议趁早迁移：

| 旧 API | 替代品 |
|---|---|
| `add*` 不传 `layerName`（仅使用 `ConfigManager.DEFAULT_*.layerName`） | `add*` 显式传 `layerName` |
| `addPolygonByUrl`（同步） | `addPolygonByUrlAsync`（Promise） |
| `addLineByUrl`（同步） | `addLineByUrlAsync`（Promise） |
| `MyOl.getView` | `MyOl.createView` |
| `PulsePointIconOptions.src` | `PulsePointIconOptions.img` |
| `(MyOl as any).initializeProjections` | `ProjectionManager.initialize` |

---

## 4. 升级前后检查清单

- [ ] 所有 `add*` 调用都显式传 `layerName`（TS 编译会提示）
- [ ] `addPolygonByUrl` / `addLineByUrl` 后立刻取 features / fit view 的地方，改成 `await *Async` 版本
- [ ] `MyOl.destroy()` 调用后是否真的需要重建地图（destroy 已强化级联清理，老代码可能不再需要手动 stop 各 handle）
- [ ] 自定义投影注册：尝试迁移到 `ProjectionManager.register` 集中管理
- [ ] 全局样式默认值：用 `ConfigManager.setDefaults` 替代多处复制 options

升级过程中遇到任何"老代码 TS 编译过不去"的情况，请优先翻看本指南第 1 节。

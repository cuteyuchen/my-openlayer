import type {
  ClusterPointLayerOptions,
  MyOl,
  PointData,
  PointLayerOptions,
  PulsePointLayerHandle,
  PulsePointLayerOptions
} from '../src';

declare const map: MyOl;

const warningPoints: PointData[] = [
  { lgtd: 120.15, lttd: 30.27, name: 'Warning Village', lev: 0 },
  { lgtd: 120.18, lttd: 30.31, name: 'Normal Village', lev: 3 }
];

const pointOptions: PointLayerOptions = {
  layerName: 'warning-village',
  img: '/icons/village.svg',
  textKey: 'name'
};

const clusterOptions: ClusterPointLayerOptions = {
  layerName: 'warning-village-cluster',
  distance: 40,
  textKey: 'name'
};

const pulseOptions: PulsePointLayerOptions = {
  layerName: 'warning-village-pulse',
  levelKey: 'lev',
  img: '/icons/village.svg',
  scale: 0.8,
  iconColor: '#06b7fd',
  textKey: 'name',
  textVisible: true,
  pulse: {
    enabled: true,
    duration: 2400,
    radius: [8, 28],
    frameCount: 24,
    colorMap: {
      0: 'rgba(255, 48, 54, 0.48)',
      3: 'rgba(6, 183, 253, 0.32)'
    }
  }
};

map.getPoint().addPoint(warningPoints, pointOptions);
map.getPoint().addClusterPoint(warningPoints, clusterOptions);
const handle: PulsePointLayerHandle | null = map.getPoint().addPulsePointLayer(warningPoints, pulseOptions);

handle?.stop();
handle?.start();
handle?.setVisible(true);
handle?.updateData(warningPoints);
handle?.remove();

// @ts-expect-error 公开点图层入口仍要求 layerName 必填
const missingLayerName: PointLayerOptions = { textKey: 'name' };

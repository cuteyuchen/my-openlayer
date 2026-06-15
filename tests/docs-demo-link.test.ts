import { describe, expect, it } from 'vitest';
import config from '../docs/.vitepress/config.mts';

describe('docs Demo link', () => {
  it('Demo 导航跳转到已发布 demo 子站，避免被 VitePress 内部路由接管', () => {
    const nav = (config as any).themeConfig?.nav ?? [];
    const demo = nav.find((item: { text?: string }) => item.text === 'Demo');

    expect(demo).toBeTruthy();
    expect(demo.link).toBe('https://cuteyuchen.github.io/my-openlayer/demo/');
  });
});

import { describe, expect, it } from 'vitest';
import ValidationUtils from '../src/utils/ValidationUtils';

describe('ValidationUtils 坐标校验', () => {
  it('不会把 0 经度或 0 纬度误判为无效', () => {
    expect(ValidationUtils.validateLngLat(0, 0)).toBe(true);
    expect(ValidationUtils.validateCoordinates({ lgtd: 0, lttd: 0 })).toBe(true);
    expect(() => ValidationUtils.validateCoordinate(0, 0)).not.toThrow();
  });

  it('会拒绝 undefined、null 和 NaN 坐标', () => {
    expect(ValidationUtils.validateLngLat(Number.NaN, 0)).toBe(false);
    expect(ValidationUtils.validateCoordinates({ lgtd: undefined, lttd: 0 })).toBe(false);
    expect(ValidationUtils.validateCoordinates({ lgtd: null, lttd: 0 })).toBe(false);
  });
});

// @vitest-environment happy-dom
/**
 * 统一错误处理回归测试：验证外层 catch 不会对已处理的 MyOpenLayersError 二次包装。
 *
 * 修复前问题：
 * - constructor catch 把 validateConstructorParams 抛出的 VALIDATION_ERROR 包装成 MAP_ERROR
 * - locationAction catch 把参数校验抛出的 VALIDATION_ERROR / COORDINATE_ERROR 包装成 MAP_ERROR
 * - 以上均导致错误回调被触发两次
 *
 * 修复后：
 * - 外层 catch 发现 error instanceof MyOpenLayersError 时直接 rethrow，不再包装
 * - 错误回调只触发一次（在 createAndHandleError 时）
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorHandler, ErrorType, MyOpenLayersError } from '../src/utils/ErrorHandler';
import MyOl from '../src/MyOl';

describe('外层 catch 不二次包装 MyOpenLayersError', () => {
  let errorHandler: ErrorHandler;
  let callback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    callback = vi.fn();
    errorHandler.addErrorCallback(callback);
  });

  afterEach(() => {
    errorHandler.removeErrorCallback(callback);
    vi.restoreAllMocks();
  });

  describe('constructor 参数校验', () => {
    it('传空 id 字符串，最终抛出 VALIDATION_ERROR，回调只触发一次', () => {
      // 空字符串会命中 "地图容器 ID 必须是非空字符串" 的校验
      // 只调用一次构造函数，用 try/catch 捕获
      try {
        new MyOl('');
        // 不应到达这里
        expect.unreachable('new MyOl(\'\') should throw');
      } catch (error) {
        // 错误类型应为 VALIDATION_ERROR，不是被包装后的 MAP_ERROR
        expect(error).toBeInstanceOf(MyOpenLayersError);
        expect((error as MyOpenLayersError).type).toBe(ErrorType.VALIDATION_ERROR);
      }

      // createAndHandleError 只应被调用一次（校验时），不应被外层 catch 二次调用
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('locationAction 参数校验', () => {
    let map: MyOl;
    let mapCallback: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // happy-dom 环境中创建有效的地图容器 DOM 元素
      const container = document.createElement('div');
      container.id = 'test-map-location';
      container.style.width = '200px';
      container.style.height = '200px';
      document.body.appendChild(container);

      mapCallback = vi.fn();
      errorHandler.addErrorCallback(mapCallback);

      map = new MyOl('test-map-location', {
        center: [120, 30],
        zoom: 10,
      });

      // 清除构造过程中产生的回调记录
      mapCallback.mockClear();
      callback.mockClear();
    });

    afterEach(() => {
      errorHandler.removeErrorCallback(mapCallback);
      try { map.destroy(); } catch { /* ignore */ }
      const el = document.getElementById('test-map-location');
      if (el) el.remove();
    });

    it('经纬度非数字 → VALIDATION_ERROR，不是 MAP_ERROR，回调只触发一次', () => {
      try {
        map.locationAction('x' as any, 30);
        expect.unreachable('locationAction should throw for non-number input');
      } catch (error) {
        expect(error).toBeInstanceOf(MyOpenLayersError);
        expect((error as MyOpenLayersError).type).toBe(ErrorType.VALIDATION_ERROR);
        expect((error as MyOpenLayersError).type).not.toBe(ErrorType.MAP_ERROR);
      }

      // 只触发一次（VALIDATION_ERROR），不应再有 MAP_ERROR 的第二次触发
      expect(mapCallback).toHaveBeenCalledTimes(1);
    });

    it('经度 181 → COORDINATE_ERROR，不是 MAP_ERROR，回调只触发一次', () => {
      try {
        map.locationAction(181, 30);
        expect.unreachable('locationAction should throw for longitude > 180');
      } catch (error) {
        expect(error).toBeInstanceOf(MyOpenLayersError);
        expect((error as MyOpenLayersError).type).toBe(ErrorType.COORDINATE_ERROR);
        expect((error as MyOpenLayersError).type).not.toBe(ErrorType.MAP_ERROR);
      }

      // 只触发一次（COORDINATE_ERROR），不应再有 MAP_ERROR 的第二次触发
      expect(mapCallback).toHaveBeenCalledTimes(1);
    });

    it('纬度 91 → COORDINATE_ERROR，不是 MAP_ERROR', () => {
      try {
        map.locationAction(120, 91);
        expect.unreachable('locationAction should throw for latitude > 90');
      } catch (error) {
        expect(error).toBeInstanceOf(MyOpenLayersError);
        expect((error as MyOpenLayersError).type).toBe(ErrorType.COORDINATE_ERROR);
      }

      expect(mapCallback).toHaveBeenCalledTimes(1);
    });

    it('经纬度 Infinity → VALIDATION_ERROR，不是 MAP_ERROR', () => {
      try {
        map.locationAction(Infinity, 30);
        expect.unreachable('locationAction should throw for Infinity input');
      } catch (error) {
        expect(error).toBeInstanceOf(MyOpenLayersError);
        expect((error as MyOpenLayersError).type).toBe(ErrorType.VALIDATION_ERROR);
      }

      expect(mapCallback).toHaveBeenCalledTimes(1);
    });
  });
});

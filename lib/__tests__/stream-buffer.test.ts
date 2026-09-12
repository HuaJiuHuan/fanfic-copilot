import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StreamBuffer, RenderThrottle } from '@/lib/stream-buffer';

function mockRAF() {
  vi.useFakeTimers();
  globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
    return setTimeout(cb, 16) as unknown as number;
  });
  globalThis.cancelAnimationFrame = vi.fn((id: number) => {
    clearTimeout(id);
  });
}

function restoreRAF() {
  vi.useRealTimers();
}

// ==================== RenderThrottle ====================

describe('RenderThrottle', () => {
  beforeEach(() => mockRAF());
  afterEach(() => restoreRAF());

  describe('单帧去重', () => {
    it('同一帧内多次 setValue 只触发一次 callback', () => {
      const callback = vi.fn();
      const throttle = new RenderThrottle(callback);

      for (let i = 0; i < 10; i++) {
        throttle.setValue(`value-${i}`);
      }

      expect(requestAnimationFrame).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(16);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('value-9');
    });
  });

  describe('高频输入收敛', () => {
    it('120 次/秒输入 → callback 收敛至 ≤60 次', () => {
      const callback = vi.fn();
      const throttle = new RenderThrottle(callback);

      const inputCount = 120;
      const intervalMs = 8;

      for (let i = 0; i < inputCount; i++) {
        throttle.setValue(`chunk-${i}`);
        vi.advanceTimersByTime(intervalMs);
      }

      vi.advanceTimersByTime(20);

      expect(callback.mock.calls.length).toBeLessThanOrEqual(60);
      expect(callback.mock.calls.length).toBeGreaterThan(0);
    });

    it('高频输入时最后一次 setValue 不会丢失', () => {
      const callback = vi.fn();
      const throttle = new RenderThrottle(callback);

      for (let i = 0; i < 120; i++) {
        throttle.setValue(`chunk-${i}`);
        vi.advanceTimersByTime(8);
      }

      vi.advanceTimersByTime(20);

      const lastCall = callback.mock.calls[callback.mock.calls.length - 1][0];
      expect(lastCall).toBe('chunk-119');
    });
  });

  describe('flush() 立即触发', () => {
    it('应取消 pending rAF 并同步调用 callback', () => {
      const callback = vi.fn();
      const throttle = new RenderThrottle(callback);

      throttle.setValue('pending');
      throttle.setValue('latest');

      throttle.flush();

      expect(cancelAnimationFrame).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith('latest');
    });
  });

  describe('destroy() 资源清理', () => {
    it('销毁后不再触发 callback', () => {
      const callback = vi.fn();
      const throttle = new RenderThrottle(callback);

      throttle.setValue('test');
      throttle.destroy();

      vi.advanceTimersByTime(100);

      expect(callback).not.toHaveBeenCalled();
    });
  });
});

// ==================== StreamBuffer ====================

describe('StreamBuffer', () => {
  describe('增量累加（浏览器环境）', () => {
    beforeEach(() => {
      vi.stubGlobal('window', {});
      mockRAF();
    });
    afterEach(() => {
      vi.unstubAllGlobals();
      restoreRAF();
    });

    it('多次 append 后通过 rAF 批量刷新，输出完整累加文本', () => {
      const callback = vi.fn();
      const buffer = new StreamBuffer({ onFlush: callback });

      buffer.append('Hello');
      buffer.append(' ');
      buffer.append('World');

      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(16);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('Hello World');
    });
  });

  describe('forceFlush()', () => {
    it('应强制刷新当前缓冲区，绕过 rAF', () => {
      const callback = vi.fn();
      const buffer = new StreamBuffer({ onFlush: callback });

      buffer.append('partial');
      buffer.forceFlush();

      expect(callback).toHaveBeenCalledWith('partial');
    });
  });

  describe('destroy()', () => {
    it('销毁后缓冲区应清空，pending rAF 被取消', () => {
      vi.stubGlobal('window', {});
      mockRAF();

      const callback = vi.fn();
      const buffer = new StreamBuffer({ onFlush: callback });

      buffer.append('leak');
      buffer.destroy();

      expect(cancelAnimationFrame).toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(callback).not.toHaveBeenCalled();

      vi.unstubAllGlobals();
      restoreRAF();
    });
  });
});

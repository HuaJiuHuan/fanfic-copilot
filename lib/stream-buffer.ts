/**
 * StreamBuffer - 流式内容缓冲器（增量累加模式）
 *
 * 将高频 SSE chunk 缓冲后通过 requestAnimationFrame 批量刷新，
 * 将渲染频次从 80-120 次/秒收敛至 ≤60 次/秒。
 *
 * 适用于：API 每次只发送增量 delta（如 AI SDK 的 textStream）
 *
 * 使用示例：
 * ```typescript
 * const buffer = new StreamBuffer({
 *   onFlush: (fullText) => setState({ content: fullText }),
 * })
 *
 * for await (const chunk of stream) {
 *   buffer.append(chunk)  // 每个 delta 追加到缓冲区
 * }
 * buffer.forceFlush()     // 流结束，强制刷新
 * buffer.destroy()        // 清理
 * ```
 */

export interface StreamBufferOptions {
  onFlush: (content: string) => void;
}

export class StreamBuffer {
  private buffer = '';
  private rafId: number | null = null;
  private onFlush: (content: string) => void;
  private isSSR: boolean;

  constructor(options: StreamBufferOptions) {
    this.onFlush = options.onFlush;
    this.isSSR = typeof window === 'undefined';
  }

  append(chunk: string): void {
    this.buffer += chunk;

    if (this.isSSR) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  private scheduleFlush(): void {
    if (this.rafId !== null) return;

    this.rafId = requestAnimationFrame(() => {
      this.flush();
      this.rafId = null;
    });
  }

  private flush(): void {
    if (this.buffer) {
      this.onFlush(this.buffer);
      this.buffer = '';
    }
  }

  forceFlush(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.flush();
  }

  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.buffer = '';
  }
}

/**
 * RenderThrottle - 渲染节流器（全文替换模式）
 *
 * 与 StreamBuffer 不同，RenderThrottle 每次接收的是**完整的最新值**（而非增量），
 * 仅保留最新值并在 requestAnimationFrame 回调中刷新，丢弃中间值。
 *
 * 适用于：API 每次发送 accumulated 全文（如 SSE 中的 data.accumulated）
 *
 * 使用示例：
 * ```typescript
 * const throttle = new RenderThrottle((latestText) => {
 *   setState({ content: latestText })
 * })
 *
 * for await (const chunk of stream) {
 *   throttle.setValue(chunk.accumulated)  // 全文替换，只保留最新
 * }
 * throttle.flush()   // 流结束，确保最新值被渲染
 * throttle.destroy() // 清理
 * ```
 */

export class RenderThrottle {
  private latestValue: string | null = null;
  private rafId: number | null = null;
  private callback: (value: string) => void;

  constructor(callback: (value: string) => void) {
    this.callback = callback;
  }

  setValue(value: string): void {
    this.latestValue = value;
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.rafId !== null) return;

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      if (this.latestValue !== null) {
        this.callback(this.latestValue);
      }
    });
  }

  flush(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.latestValue !== null) {
      this.callback(this.latestValue);
    }
  }

  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.latestValue = null;
  }
}

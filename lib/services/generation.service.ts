import { RenderThrottle } from '@/lib/stream-buffer';

interface GenerationCallbacks {
  onChunk: (accumulated: string) => void;
  onPhaseChange: (phase: string) => void;
  onComplete: (finalText: string, editorReview: unknown) => void;
  onError: (message: string) => void;
}

interface GenerateRequest {
  projectId: string;
  fandom: string;
  characters: string;
  premise: string;
  sceneInfo: {
    sceneId: string;
    sceneNumber: number;
    location: string;
    plotAction: string;
    conflict: string;
    emotionalShift: string;
    wordCount?: number;
    style?: string;
    customNote?: string;
  };
}

export async function streamGeneration(
  requestBody: GenerateRequest,
  callbacks: GenerationCallbacks,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch('/api/generate-scene', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
    signal,
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const writingThrottle = new RenderThrottle(callbacks.onChunk);

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = JSON.parse(line.slice(6));

        switch (data.phase) {
          case 'setting':
            callbacks.onPhaseChange('setting');
            break;
          case 'writing':
            callbacks.onPhaseChange('writing');
            if (data.accumulated) {
              writingThrottle.setValue(data.accumulated);
            }
            break;
          case 'editing':
            writingThrottle.flush();
            callbacks.onPhaseChange('editing');
            break;
          case 'complete':
            writingThrottle.flush();
            callbacks.onPhaseChange('complete');
            callbacks.onComplete(data.finalText, data.editorReview ?? null);
            break;
          case 'error':
            writingThrottle.flush();
            callbacks.onError(data.message ?? '未知错误');
            break;
        }
      }
    }
  } finally {
    writingThrottle.destroy();
  }
}

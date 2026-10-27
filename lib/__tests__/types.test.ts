import { describe, expect, it } from 'vitest';
import { SOURCE_WEIGHTS, type CorpusSource, type TagsData } from '@/lib/types';

describe('SOURCE_WEIGHTS', () => {
  const expectedSources: CorpusSource[] = [
    'manual',
    'script_extract',
    'scene',
    'chat',
    'interview',
    'preference',
    'import',
  ];

  it('所有权重值在 [0, 1] 范围内', () => {
    for (const [key, weight] of Object.entries(SOURCE_WEIGHTS)) {
      expect(weight, `${key} 的权重 ${weight} 应 ≤ 1`).toBeLessThanOrEqual(1);
      expect(weight, `${key} 的权重 ${weight} 应 ≥ 0`).toBeGreaterThanOrEqual(0);
    }
  });

  it('包含全部 7 个 CorpusSource key', () => {
    const keys = Object.keys(SOURCE_WEIGHTS) as CorpusSource[];
    expect(keys).toHaveLength(7);
    for (const source of expectedSources) {
      expect(keys).toContain(source);
    }
  });

  it('manual 权重最高（1.0）', () => {
    expect(SOURCE_WEIGHTS['manual']).toBe(1.0);
    for (const source of expectedSources) {
      expect(SOURCE_WEIGHTS[source]).toBeLessThanOrEqual(1.0);
    }
  });

  it('import 权重最低（0.40）', () => {
    for (const source of expectedSources) {
      expect(SOURCE_WEIGHTS[source]).toBeGreaterThanOrEqual(SOURCE_WEIGHTS['import']);
    }
  });
});

describe('TagsData 结构验证', () => {
  it('合法 TagsData 对象包含 preset 和 free 数组', () => {
    const tags: TagsData = { preset: ['标签1'], free: ['自定义'] };
    expect(tags).toHaveProperty('preset');
    expect(tags).toHaveProperty('free');
    expect(Array.isArray(tags.preset)).toBe(true);
    expect(Array.isArray(tags.free)).toBe(true);
  });

  it('preset 和 free 可以为空数组', () => {
    const tags: TagsData = { preset: [], free: [] };
    expect(tags.preset).toEqual([]);
    expect(tags.free).toEqual([]);
  });
});
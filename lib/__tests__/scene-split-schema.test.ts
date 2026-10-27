import { describe, expect, it } from 'vitest';
import { SceneSplitSchema } from '@/lib/validators/scene-split';

const validSplit = {
  segments: [
    { sceneId: 'act1_scene1', content: '这是第一段原文内容' },
    { sceneId: 'act1_scene2', content: '这是第二段原文内容' },
  ],
};

describe('SceneSplitSchema 合法数据', () => {
  it('完整合法分段解析成功', () => {
    const result = SceneSplitSchema.safeParse(validSplit);
    expect(result.success).toBe(true);
  });

  it('segments 为空数组，合法', () => {
    const result = SceneSplitSchema.safeParse({ segments: [] });
    expect(result.success).toBe(true);
  });

  it('单元素 segments，合法', () => {
    const result = SceneSplitSchema.safeParse({
      segments: [{ sceneId: 's1', content: '内容' }],
    });
    expect(result.success).toBe(true);
  });
});

describe('SceneSplitSchema 非法数据', () => {
  it('缺少 segments 字段，解析失败', () => {
    const result = SceneSplitSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('segments 不是数组，解析失败', () => {
    const result = SceneSplitSchema.safeParse({ segments: '字符串' });
    expect(result.success).toBe(false);
  });

  it('segment 缺少 sceneId，解析失败', () => {
    const result = SceneSplitSchema.safeParse({
      segments: [{ content: '内容' }],
    });
    expect(result.success).toBe(false);
  });

  it('segment 缺少 content，解析失败', () => {
    const result = SceneSplitSchema.safeParse({
      segments: [{ sceneId: 's1' }],
    });
    expect(result.success).toBe(false);
  });

  it('sceneId 为空字符串，合法但可能不合理（无 min 约束）', () => {
    const result = SceneSplitSchema.safeParse({
      segments: [{ sceneId: '', content: '内容' }],
    });
    expect(result.success).toBe(true);
  });
});
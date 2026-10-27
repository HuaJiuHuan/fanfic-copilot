import { describe, expect, it } from 'vitest';
import { StoryOutlineSchema } from '@/lib/validators/story-outline';

const validOutline = {
  title: '测试标题',
  logline: '主角想要拯救世界，但最大的阻碍是自己内心的恐惧',
  characterArcs: [
    { name: '主角', coreMotivation: '克服内心的恐惧' },
  ],
  acts: [
    {
      actTitle: '起因',
      scenes: [
        {
          id: 'act1_scene1',
          sceneNumber: 1,
          location: '学校',
          plotAction: '主角发现了异常',
          conflict: '内心的挣扎',
          emotionalShift: '从期待到绝望',
        },
      ],
    },
  ],
};

describe('StoryOutlineSchema 合法数据', () => {
  it('完整合法大纲解析成功', () => {
    const result = StoryOutlineSchema.safeParse(validOutline);
    expect(result.success).toBe(true);
  });

  it('acts 为空数组，合法', () => {
    const result = StoryOutlineSchema.safeParse({ ...validOutline, acts: [] });
    expect(result.success).toBe(true);
  });

  it('characterArcs 为必填字段，不传会失败', () => {
    const { characterArcs, ...withoutArcs } = validOutline;
    const result = StoryOutlineSchema.safeParse(withoutArcs);
    expect(result.success).toBe(false);
  });

  it('characterArcs 为空数组，合法', () => {
    const result = StoryOutlineSchema.safeParse({ ...validOutline, characterArcs: [] });
    expect(result.success).toBe(true);
  });
});

describe('StoryOutlineSchema 非法数据', () => {
  it('缺少 title 字段，解析失败', () => {
    const { title, ...withoutTitle } = validOutline;
    const result = StoryOutlineSchema.safeParse(withoutTitle);
    expect(result.success).toBe(false);
  });

  it('缺少 logline 字段，解析失败', () => {
    const { logline, ...withoutLogline } = validOutline;
    const result = StoryOutlineSchema.safeParse(withoutLogline);
    expect(result.success).toBe(false);
  });

  it('acts 超过 4 个，解析失败', () => {
    const tooManyActs = {
      ...validOutline,
      acts: [
        { actTitle: '起因', scenes: [] },
        { actTitle: '发展', scenes: [] },
        { actTitle: '高潮', scenes: [] },
        { actTitle: '结局', scenes: [] },
        { actTitle: '尾声', scenes: [] },
      ],
    };
    const result = StoryOutlineSchema.safeParse(tooManyActs);
    expect(result.success).toBe(false);
  });

  it('acts 恰好 4 个，合法', () => {
    const fourActs = {
      ...validOutline,
      acts: [
        { actTitle: '起因', scenes: [] },
        { actTitle: '发展', scenes: [] },
        { actTitle: '高潮', scenes: [] },
        { actTitle: '结局', scenes: [] },
      ],
    };
    const result = StoryOutlineSchema.safeParse(fourActs);
    expect(result.success).toBe(true);
  });

  it('sceneNumber 为字符串，解析失败', () => {
    const invalidSceneNumber = {
      ...validOutline,
      acts: [
        {
          actTitle: '起因',
          scenes: [
            { ...validOutline.acts[0].scenes[0], sceneNumber: '一' },
          ],
        },
      ],
    };
    const result = StoryOutlineSchema.safeParse(invalidSceneNumber);
    expect(result.success).toBe(false);
  });

  it('场景缺少 id 字段，解析失败', () => {
    const { id, ...withoutId } = validOutline.acts[0].scenes[0];
    const invalid = {
      ...validOutline,
      acts: [{ actTitle: '起因', scenes: [withoutId] }],
    };
    const result = StoryOutlineSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('场景缺少 location 字段，解析失败', () => {
    const { location, ...withoutLocation } = validOutline.acts[0].scenes[0];
    const invalid = {
      ...validOutline,
      acts: [{ actTitle: '起因', scenes: [withoutLocation] }],
    };
    const result = StoryOutlineSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('characterArcs 中缺少 coreMotivation，解析失败', () => {
    const invalid = {
      ...validOutline,
      characterArcs: [{ name: '主角' }],
    };
    const result = StoryOutlineSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('characterArcs 中缺少 name，解析失败', () => {
    const invalid = {
      ...validOutline,
      characterArcs: [{ coreMotivation: '动机' }],
    };
    const result = StoryOutlineSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('StoryOutlineSchema 解析后数据完整性', () => {
  it('safeParse 成功后 data 字段与原数据匹配', () => {
    const result = StoryOutlineSchema.safeParse(validOutline);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('测试标题');
      expect(result.data.logline).toBe(validOutline.logline);
      expect(result.data.acts).toHaveLength(1);
      expect(result.data.characterArcs).toHaveLength(1);
    }
  });
});
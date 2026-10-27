import { describe, expect, it } from 'vitest';
import {
  StoryExtractionSchema,
  CharacterProfileExtractionSchema,
} from '@/lib/validators/story-extraction';

const validCharacterProfile = {
  name: '哈利·波特',
  voice: '少年感、偶尔冲动、语气真诚',
  bio: '霍格沃茨学生，额头有闪电形伤疤',
  relationships: '与赫敏和罗恩是好友，与伏地魔是宿敌',
};

const validExtraction = {
  title: '测试标题',
  fandom: '哈利波特',
  characters: '哈利·波特, 赫敏·格兰杰',
  premise: '哈利发现了一个隐藏的魔法世界，必须阻止黑暗势力的崛起',
  characterProfiles: [validCharacterProfile],
};

describe('StoryExtractionSchema 合法数据', () => {
  it('完整合法提取解析成功', () => {
    const result = StoryExtractionSchema.safeParse(validExtraction);
    expect(result.success).toBe(true);
  });

  it('characterProfiles 可选，不传也能通过', () => {
    const { characterProfiles, ...withoutProfiles } = validExtraction;
    const result = StoryExtractionSchema.safeParse(withoutProfiles);
    expect(result.success).toBe(true);
  });

  it('characterProfiles 为空数组，合法', () => {
    const result = StoryExtractionSchema.safeParse({
      ...validExtraction,
      characterProfiles: [],
    });
    expect(result.success).toBe(true);
  });

  it('characterProfiles 包含多个角色，合法', () => {
    const result = StoryExtractionSchema.safeParse({
      ...validExtraction,
      characterProfiles: [
        validCharacterProfile,
        { name: '赫敏', voice: '理性和博学', bio: '学霸', relationships: '与哈利和罗恩是好友' },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe('StoryExtractionSchema 非法数据', () => {
  it('缺少 title，解析失败', () => {
    const { title, ...without } = validExtraction;
    expect(StoryExtractionSchema.safeParse(without).success).toBe(false);
  });

  it('缺少 fandom，解析失败', () => {
    const { fandom, ...without } = validExtraction;
    expect(StoryExtractionSchema.safeParse(without).success).toBe(false);
  });

  it('缺少 premise，解析失败', () => {
    const { premise, ...without } = validExtraction;
    expect(StoryExtractionSchema.safeParse(without).success).toBe(false);
  });

  it('premise 可以为空字符串（z.string 无 min 约束）', () => {
    const result = StoryExtractionSchema.safeParse({
      ...validExtraction,
      premise: '',
    });
    expect(result.success).toBe(true);
  });
});

describe('CharacterProfileExtractionSchema', () => {
  it('完整合法角色解析成功', () => {
    const result = CharacterProfileExtractionSchema.safeParse(validCharacterProfile);
    expect(result.success).toBe(true);
  });

  it('缺少 name，解析失败', () => {
    const { name, ...without } = validCharacterProfile;
    expect(CharacterProfileExtractionSchema.safeParse(without).success).toBe(false);
  });

  it('缺少 voice，解析失败', () => {
    const { voice, ...without } = validCharacterProfile;
    expect(CharacterProfileExtractionSchema.safeParse(without).success).toBe(false);
  });

  it('缺少 bio，解析失败', () => {
    const { bio, ...without } = validCharacterProfile;
    expect(CharacterProfileExtractionSchema.safeParse(without).success).toBe(false);
  });

  it('缺少 relationships，解析失败', () => {
    const { relationships, ...without } = validCharacterProfile;
    expect(CharacterProfileExtractionSchema.safeParse(without).success).toBe(false);
  });
});
import { z } from 'zod';

export const CharacterProfileExtractionSchema = z.object({
  name: z.string().describe('角色名称'),
  voice: z.string().describe('角色的说话风格、语气特征、口头禅、句式节奏。写法示例："慵懒、带刺、句短、尾音下沉。生气时反而更安静" 或 "敬语体、句末加呢哦、犹豫时用省略号"'),
  bio: z.string().describe('角色的外貌、性格、背景故事、身份等信息，100字以内'),
  relationships: z.string().describe('与其他角色的关系，如"对A有保护欲""对B保持警惕""与C是死对头"'),
});

export const StoryExtractionSchema = z.object({
  title: z.string().describe('为这篇短篇取一个合适的标题'),
  fandom: z.string().describe('这篇小说所属的原著/世界观/宇宙（如：哈利波特、漫威、原创等）'),
  characters: z.string().describe('文中出现的核心角色名称，用逗号分隔，如：哈利·波特, 赫敏·格兰杰'),
  premise: z.string().describe('一句话概括这篇小说的核心脑洞和故事主线，100字以内'),
  characterProfiles: z
    .array(CharacterProfileExtractionSchema)
    .optional()
    .describe('从原文中提取每个核心角色的声线卡，包含语气、人设、关系。只提取确有台词和性格描写的角色。若文中没有足够的角色描写，可以不填。'),
});

export type StoryExtraction = z.infer<typeof StoryExtractionSchema>;
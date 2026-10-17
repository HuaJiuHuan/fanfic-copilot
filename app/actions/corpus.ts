'use server';

import { generateText } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { AI_CONFIG } from '@/lib/ai-config';
import type { CharacterProfile, CorpusLine } from '@/lib/types';

interface ThreeVariant {
  axis: string;
  hypothesis: string;
  lines: CorpusLine[];
}

type GenerateResult = {
  success: true;
  variants: ThreeVariant[];
} | {
  success: false;
  error: string;
};

export async function generateThreeVariantsAction(
  char: CharacterProfile,
  scenario: string,
  scenarioLabel: string,
): Promise<GenerateResult> {
  const scenarioDesc = scenarioLabel || scenario;

  const charCard = [
    char.name ? `角色：${char.name}` : '',
    char.voice ? `语气：${char.voice}` : '',
    char.bio ? `人设：${char.bio}` : '',
    char.relationships ? `角色关系：${char.relationships}` : '',
    char.coreMotivation ? `核心动机：${char.coreMotivation}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const systemPrompt = `你是一个角色对白生成助手。你的任务是为指定角色在特定场景下，生成 3 种不同声线方向的对白。

每种方向必须有明显不同的说话方式（不是同样的话改几个字），你要像一个演员在尝试不同的表演方式。

输出格式要求：严格输出 3 个块，每个块之间用 --- 分隔。每个块的格式如下：

axis: 声线方向标签（如"毒舌""外冷内热""温柔克制"等，不超过 5 字）
hypothesis: AI 生成此变体时的表演假设（如"用讽刺掩饰受伤""越是紧张越装作不在乎"等，不超过 30 字）
---
对话内容（每条台词一行，格式为 "角色：台词"，self 代表本角色）

重要：对白要短（每句 5-20 字），要有回合感（至少 3 轮对话），要像真人在说话而不是在念小说。`;

  const userPrompt = `角色信息：
${charCard}

场景：${scenarioDesc}

请为「${char.name || '该角色'}」在「${scenarioDesc}」这个场景下，生成 3 组不同声线方向的对白。`;

  try {
    const { text } = await generateText({
      model: deepseek(AI_CONFIG.model),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.9,
      maxOutputTokens: 1500,
    });

    const variants = parseVariants(text, char.name || '角色');
    if (variants.length < 2) {
      return { success: false, error: 'AI 生成的变体数量不足，请重试' };
    }

    return { success: true, variants: variants.slice(0, 3) };
  } catch (error) {
    console.error('生成三选一变体失败:', error);
    return { success: false, error: '生成失败，请重试' };
  }
}

function parseVariants(raw: string, selfName: string): ThreeVariant[] {
  const cleaned = raw.replace(/^```[\s\S]*?\n/gm, '').replace(/```$/gm, '');
  const blocks = cleaned.split(/\n---+\n/).filter((b) => b.trim());

  return blocks.map((block) => {
    const lines = block.trim().split('\n').filter((l) => l.trim());
    let axis = '';
    let hypothesis = '';
    const dialogueLines: CorpusLine[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('axis:') || trimmed.startsWith('axis：')) {
        axis = trimmed.replace(/^axis[：:]\s*/, '').trim();
      } else if (trimmed.startsWith('hypothesis:') || trimmed.startsWith('hypothesis：')) {
        hypothesis = trimmed.replace(/^hypothesis[：:]\s*/, '').trim();
      } else if (trimmed.includes('：') || trimmed.includes(':')) {
        const separator = trimmed.includes('：') ? '：' : ':';
        const [speaker, ...textParts] = trimmed.split(separator);
        const text = textParts.join(separator).trim();
        if (text && speaker.trim()) {
          const speakerName = speaker.trim();
          dialogueLines.push({
            speaker: speakerName === 'self' || speakerName === selfName ? 'self' : speakerName,
            text,
          });
        }
      } else if (trimmed.startsWith('axis')) {
        axis = trimmed.replace(/^axis\s*/, '').trim();
      } else if (trimmed.startsWith('hypothesis')) {
        hypothesis = trimmed.replace(/^hypothesis\s*/, '').trim();
      }
    }

    return { axis, hypothesis, lines: dialogueLines };
  });
}

type AutoFillResult = {
  success: true;
  fields: { name: string; voice: string; bio: string; relationships: string; coreMotivation: string };
} | {
  success: false;
  error: string;
};

export async function autoFillCharacterAction(
  description: string,
): Promise<AutoFillResult> {
  const systemPrompt = `你是一个角色设定生成助手。根据用户提供的一段简短描述，生成完整的角色设定。

输出格式：严格按以下格式输出，每个字段一行，用中文冒号分隔。

角色名：（不超过10字）
语气标签：（描述说话风格、口头禅、节奏，不超过50字）
人设简介：（外貌、性格、背景，不超过100字）
角色关系：（与其他角色的关系，如无则写"暂无"，不超过80字）
核心动机：（当前故事中的核心驱动力，不超过60字）`;

  try {
    const { text } = await generateText({
      model: deepseek(AI_CONFIG.model),
      system: systemPrompt,
      prompt: `请为以下描述生成角色设定：\n\n${description}`,
      temperature: 0.7,
      maxOutputTokens: 600,
    });

    const fields = parseAutoFill(text);
    if (!fields.name && !fields.voice && !fields.bio) {
      return { success: false, error: 'AI 未能生成有效角色设定，请尝试更详细的描述' };
    }

    return { success: true, fields };
  } catch (error) {
    console.error('自动填充角色失败:', error);
    return { success: false, error: '生成失败，请重试' };
  }
}

function parseAutoFill(raw: string): { name: string; voice: string; bio: string; relationships: string; coreMotivation: string } {
  const result = { name: '', voice: '', bio: '', relationships: '', coreMotivation: '' };
  const lines = raw.split('\n').filter((l) => l.trim());

  for (const line of lines) {
    const cleaned = line.replace(/^[-*•\d.]\s*/, '').trim();
    if (cleaned.startsWith('角色名') || cleaned.startsWith('角色名：') || cleaned.startsWith('角色名:')) {
      result.name = cleaned.replace(/^角色名[：:]\s*/, '').trim();
    } else if (cleaned.startsWith('语气标签') || cleaned.startsWith('语气标签：') || cleaned.startsWith('语气标签:')) {
      result.voice = cleaned.replace(/^语气标签[：:]\s*/, '').trim();
    } else if (cleaned.startsWith('人设简介') || cleaned.startsWith('人设简介：') || cleaned.startsWith('人设简介:')) {
      result.bio = cleaned.replace(/^人设简介[：:]\s*/, '').trim();
    } else if (cleaned.startsWith('角色关系') || cleaned.startsWith('角色关系：') || cleaned.startsWith('角色关系:')) {
      result.relationships = cleaned.replace(/^角色关系[：:]\s*/, '').trim();
    } else if (cleaned.startsWith('核心动机') || cleaned.startsWith('核心动机：') || cleaned.startsWith('核心动机:')) {
      result.coreMotivation = cleaned.replace(/^核心动机[：:]\s*/, '').trim();
    }
  }

  return result;
}

type ExtractResult = {
  success: true;
  lines: CorpusLine[];
  scenario: string;
} | {
  success: false;
  error: string;
};

export async function extractDialogueAction(
  text: string,
  characterName: string,
): Promise<ExtractResult> {
  const systemPrompt = `你是一个对话提取助手。从用户提供的文本中，提取指定角色的所有对话台词。

提取规则：
1. 只提取标注说话人的对话（如"角色：台词"或"角色说："格式）
2. 如果对话没有明确标注说话人，尝试根据上下文判断哪些是目标角色说的
3. 每句台词独立一行
4. 如果找不到目标角色的对话，返回空

输出格式：
scenario: （根据文本内容推测的场景名，不超过10字）
---
台词典中，每条台词一行。speaker为"self"，text为台词内容。
speaker: self
text: 台词内容
---
speaker: self
text: 另一句台词`;

  try {
    const { text: result } = await generateText({
      model: deepseek(AI_CONFIG.model),
      system: systemPrompt,
      prompt: `目标角色：${characterName}\n\n文本内容：\n${text.slice(0, 4000)}`,
      temperature: 0.3,
      maxOutputTokens: 1000,
    });

    const parsed = parseExtract(result, characterName);
    if (parsed.lines.length === 0) {
      return { success: false, error: '未在文本中找到该角色的对话，请确认角色名或文本内容' };
    }

    return { success: true, ...parsed };
  } catch (error) {
    console.error('提取对话失败:', error);
    return { success: false, error: '提取失败，请重试' };
  }
}

function parseExtract(raw: string, characterName: string): { lines: CorpusLine[]; scenario: string } {
  const lines: CorpusLine[] = [];
  let scenario = '文本提取';
  const inDialogue = raw.split(/\n---+\n/);

  for (const block of inDialogue) {
    const trimmed = block.trim();
    if (trimmed.startsWith('scenario:') || trimmed.startsWith('scenario：')) {
      scenario = trimmed.replace(/^scenario[：:]\s*/, '').trim() || '文本提取';
    } else if (trimmed.includes('speaker:') || trimmed.includes('speaker：')) {
      const entryLines = trimmed.split('\n');
      let speaker = '';
      let text = '';
      for (const l of entryLines) {
        const t = l.trim();
        if (t.startsWith('speaker:') || t.startsWith('speaker：')) {
          speaker = t.replace(/^speaker[：:]\s*/, '').trim();
        } else if (t.startsWith('text:') || t.startsWith('text：')) {
          text = t.replace(/^text[：:]\s*/, '').trim();
          if (text) {
            lines.push({ speaker: speaker || 'self', text });
          }
        }
      }
    }
  }

  if (lines.length === 0) {
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('scenario:') || trimmed.startsWith('scenario：')) {
        scenario = trimmed.replace(/^scenario[：:]\s*/, '').trim() || '文本提取';
      } else if ((trimmed.includes('：') || trimmed.includes(':')) && !trimmed.startsWith('scenario')) {
        const sep = trimmed.includes('：') ? '：' : ':';
        const [speaker, ...textParts] = trimmed.split(sep);
        const txt = textParts.join(sep).trim();
        if (txt && speaker.trim()) {
          const sp = speaker.trim();
          lines.push({
            speaker: sp === characterName || sp === 'self' ? 'self' : sp,
            text: txt,
          });
        }
      }
    }
  }

  return { lines, scenario };
}

type ImprovResult = {
  success: true;
  reply: CorpusLine;
} | {
  success: false;
  error: string;
};

interface ImprovMessage {
  role: 'user' | 'character';
  text: string;
}

export async function actOppositeAction(
  char: CharacterProfile,
  history: ImprovMessage[],
  userMessage: string,
): Promise<ImprovResult> {
  const charCard = [
    char.name ? `角色名：${char.name}` : '',
    char.voice ? `语气标签：${char.voice}` : '',
    char.bio ? `人设简介：${char.bio}` : '',
    char.relationships ? `角色关系：${char.relationships}` : '',
    char.coreMotivation ? `核心动机：${char.coreMotivation}` : '',
  ].filter(Boolean).join('\n');

  const corpusExamples = (char.voiceCorpus || [])
    .slice(0, 5)
    .map((s) => s.lines.map((l) => `${char.name || '角色'}：${l.text}`).join('\n'))
    .join('\n\n');

  const historyStr = history
    .map((m) => `${m.role === 'user' ? '对方' : char.name || '角色'}：${m.text}`)
    .join('\n');

  const systemPrompt = `你现在就是「${char.name || '该角色'}」。请完全代入这个角色，用它的语气、性格、说话方式回复。

角色设定：
${charCard}

${corpusExamples ? `以下是该角色的对话示例，请严格模仿其语气和节奏：\n${corpusExamples}\n` : ''}

规则：
1. 只用该角色的语气说一句话，不要加任何叙述或描写
2. 回复不超过 40 字，像真人在说话，不要像在念台词
3. 不要说教，不要解释，就是角色本身在说话`;

  const userPrompt = historyStr
    ? `对话历史：\n${historyStr}\n\n对方刚说：「${userMessage}」\n\n请以「${char.name || '该角色'}」的身份回复一句话。`
    : `对方对你说：「${userMessage}」\n\n请以「${char.name || '该角色'}」的身份回复一句话。`;

  try {
    const { text } = await generateText({
      model: deepseek(AI_CONFIG.model),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.95,
      maxOutputTokens: 150,
    });

    const reply = text.trim().replace(/^["""]|["""]$/g, '').slice(0, 80);
    return {
      success: true,
      reply: { speaker: 'self', text: reply },
    };
  } catch (error) {
    console.error('言灵契定失败:', error);
    return { success: false, error: '对戏失败，请重试' };
  }
}
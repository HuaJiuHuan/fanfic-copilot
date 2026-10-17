import type { VoiceCorpusSample, CharacterProfile, StrategyMode } from '@/lib/types';
import { SOURCE_WEIGHTS } from '@/lib/types';

export const SCENARIO_PRESETS: Record<string, string> = {
  misunderstood: '被误解时',
  confrontation: '深夜对峙',
  casual: '日常对话',
  crisis: '危机时刻',
  reunion: '重逢',
  secret: '吐露秘密',
  angry: '愤怒时',
  vulnerable: '脆弱时刻',
  negotiation: '谈判博弈',
  farewell: '告别',
};

export function getScenarioPresets() {
  return SCENARIO_PRESETS;
}

function countTotalChars(samples: VoiceCorpusSample[]): number {
  return samples.reduce(
    (sum, s) =>
      sum + s.lines.reduce((lineSum, l) => lineSum + l.text.length, 0),
    0,
  );
}

function countUniqueScenarios(samples: VoiceCorpusSample[]): number {
  return new Set(samples.map((s) => s.scenario)).size;
}

function countLongScenes(samples: VoiceCorpusSample[]): number {
  return samples.filter((s) => s.source === 'scene').length;
}

export function getCorpusStats(samples?: VoiceCorpusSample[]) {
  const list = samples ?? [];
  return {
    count: list.length,
    totalChars: countTotalChars(list),
    uniqueScenarios: countUniqueScenarios(list),
    longScenes: countLongScenes(list),
  };
}

export function dialogueWritePolicy(corpus?: VoiceCorpusSample[], voice?: string): StrategyMode {
  const stats = getCorpusStats(corpus);

  const broadThreshold = stats.count >= 6 && stats.uniqueScenarios >= 5;
  const deepThreshold = stats.longScenes >= 2;
  const volumeThreshold = stats.totalChars >= 800;

  if (broadThreshold || deepThreshold || volumeThreshold) {
    return 'anchored';
  }

  if (stats.count >= 1 || (voice && voice.trim().length > 0)) {
    return 'soft';
  }

  return 'advise_only';
}

export function formatCorpusForPrompt(
  corpus: VoiceCorpusSample[],
  sceneKeywords?: string,
): string {
  if (!corpus || corpus.length === 0) return '';

  const sorted = [...corpus].sort((a, b) => {
    const scoreA = scoreSample(a, sceneKeywords);
    const scoreB = scoreSample(b, sceneKeywords);
    return scoreB - scoreA;
  });

  const topSamples = sorted.slice(0, 5);

  return `
【口吻正例】—— 按场景相关度与来源权重挑选；对齐感觉，勿照抄
${topSamples.map(formatSingleSample).join('\n')}
`.trim();
}

function scoreSample(sample: VoiceCorpusSample, sceneKeywords?: string): number {
  const baseWeight = SOURCE_WEIGHTS[sample.source] ?? 0.4;
  let score = baseWeight * 10;

  if (sceneKeywords) {
    const kw = sceneKeywords.toLowerCase();
    const scenarioLower = sample.scenario.toLowerCase();
    if (scenarioLower.includes(kw) || kw.includes(scenarioLower)) {
      score += 8;
    }
  }

  return score;
}

function formatSingleSample(s: VoiceCorpusSample): string {
  const sourceLabel =
    s.source === 'preference'
      ? '三选一'
      : s.source === 'manual'
        ? '金句'
        : s.source === 'scene'
          ? '长场次'
          : s.source;
  const label = s.scenarioLabel || s.scenario;
  const axisTag = s.axis ? ` axis=${s.axis}` : '';
  const hypTag = s.hypothesis ? ` hyp=${s.hypothesis}` : '';
  const dialogue = s.lines.map((l) => `${l.speaker === 'self' ? '' : l.speaker + '：'}${l.text}`).join('/');

  return `[${sourceLabel}·${label}]${axisTag}${hypTag}\n  ${dialogue}`;
}

export function getStrategyDisplay(mode: StrategyMode): {
  color: string;
  label: string;
} {
  switch (mode) {
    case 'anchored':
      return { color: 'bg-green-500/50', label: '声线策略：硬对照' };
    case 'soft':
      return { color: 'bg-yellow-500/50', label: '声线策略：软提示' };
    case 'advise_only':
      return { color: 'bg-red-500/40', label: '声线策略：仅建议' };
  }
}

export function buildVoiceBlock(
  profiles: CharacterProfile[],
  sceneKeywords?: string,
): string {
  if (!profiles || profiles.length === 0) return '';

  return profiles
    .filter((c) => c.name.trim())
    .map((c) => {
      const parts: string[] = [];
      const stats = getCorpusStats(c.voiceCorpus);
      const strategy = dialogueWritePolicy(c.voiceCorpus, c.voice);

      parts.push(formatCharacterCard(c));

      if (c.voiceCorpus && c.voiceCorpus.length > 0) {
        const corpusBlock = formatCorpusForPrompt(c.voiceCorpus, sceneKeywords);
        if (corpusBlock) parts.push(corpusBlock);
      }

      const strategyLine =
        strategy === 'anchored'
          ? '【声线硬对照】对白须贴近上方正例的句法与节奏，禁止通用漂亮话。'
          : strategy === 'soft'
            ? '【声线提示】请参考上方角色语气方向写作，可做短变体。'
            : '【声线降级】声线数据不足，仅参考角色卡方向，勿强制对齐。';
      parts.push(strategyLine);

      return parts.join('\n');
    })
    .join('\n\n');
}

function formatCharacterCard(c: CharacterProfile): string {
  const parts: string[] = [`- ${c.name.trim()}`];
  if (c.voice?.trim()) parts.push(`  语气: ${c.voice.trim()}`);
  if (c.bio?.trim()) parts.push(`  人设: ${c.bio.trim()}`);
  if (c.relationships?.trim()) parts.push(`  关系: ${c.relationships.trim()}`);
  if (c.coreMotivation?.trim()) parts.push(`  核心动机: ${c.coreMotivation.trim()}`);
  return parts.join('\n');
}
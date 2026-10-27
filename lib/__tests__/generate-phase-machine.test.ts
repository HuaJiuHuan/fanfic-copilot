import { describe, expect, it } from 'vitest';
import {
  eventToPhase,
  getNextPhase,
  VALID_PHASE_TRANSITIONS,
  PROGRESS_PHASES,
  type GeneratingPhase,
  type PhaseEvent,
} from '@/lib/ai/phase-machine';

describe('eventToPhase', () => {
  it('START_SETTING → setting', () => {
    expect(eventToPhase({ type: 'START_SETTING' })).toBe('setting');
  });

  it('START_WRITING → writing', () => {
    expect(eventToPhase({ type: 'START_WRITING' })).toBe('writing');
  });

  it('START_EDITING → editing', () => {
    expect(eventToPhase({ type: 'START_EDITING' })).toBe('editing');
  });

  it('COMPLETE → done', () => {
    expect(eventToPhase({ type: 'COMPLETE' })).toBe('done');
  });

  it('ERROR → idle', () => {
    expect(eventToPhase({ type: 'ERROR' })).toBe('idle');
  });

  it('ABORT → idle', () => {
    expect(eventToPhase({ type: 'ABORT' })).toBe('idle');
  });

  it('RESET → idle', () => {
    expect(eventToPhase({ type: 'RESET' })).toBe('idle');
  });
});

describe('getNextPhase 合法转换', () => {
  it('idle → START_SETTING → setting', () => {
    expect(getNextPhase('idle', { type: 'START_SETTING' })).toBe('setting');
  });

  it('setting → START_WRITING → writing', () => {
    expect(getNextPhase('setting', { type: 'START_WRITING' })).toBe('writing');
  });

  it('writing → START_EDITING → editing', () => {
    expect(getNextPhase('writing', { type: 'START_EDITING' })).toBe('editing');
  });

  it('editing → COMPLETE → done', () => {
    expect(getNextPhase('editing', { type: 'COMPLETE' })).toBe('done');
  });

  it('done → RESET → idle', () => {
    expect(getNextPhase('done', { type: 'RESET' })).toBe('idle');
  });

  it('setting → ERROR → idle（中断回退）', () => {
    expect(getNextPhase('setting', { type: 'ERROR' })).toBe('idle');
  });

  it('writing → ERROR → idle（中断回退）', () => {
    expect(getNextPhase('writing', { type: 'ERROR' })).toBe('idle');
  });

  it('writing → ABORT → idle（中止回退）', () => {
    expect(getNextPhase('writing', { type: 'ABORT' })).toBe('idle');
  });

  it('writing → RESET → idle（重置回退）', () => {
    expect(getNextPhase('writing', { type: 'RESET' })).toBe('idle');
  });

  it('editing → ERROR → idle（编辑阶段中断）', () => {
    expect(getNextPhase('editing', { type: 'ERROR' })).toBe('idle');
  });

  it('同阶段转换：idle → RESET → idle', () => {
    expect(getNextPhase('idle', { type: 'RESET' })).toBe('idle');
  });
});

describe('getNextPhase 非法转换返回 null', () => {
  it('writing → COMPLETE 非法（writing 不能直接到 done）', () => {
    expect(getNextPhase('writing', { type: 'COMPLETE' })).toBeNull();
  });

  it('idle → COMPLETE 非法（idle 只能到 setting）', () => {
    expect(getNextPhase('idle', { type: 'COMPLETE' })).toBeNull();
  });

  it('idle → START_WRITING 非法（idle 只能到 setting）', () => {
    expect(getNextPhase('idle', { type: 'START_WRITING' })).toBeNull();
  });

  it('setting → COMPLETE 非法（setting 不能到 done）', () => {
    expect(getNextPhase('setting', { type: 'COMPLETE' })).toBeNull();
  });

  it('done → START_SETTING 非法（done 只能到 idle）', () => {
    expect(getNextPhase('done', { type: 'START_SETTING' })).toBeNull();
  });
});

describe('VALID_PHASE_TRANSITIONS 完整性', () => {
  it('所有 5 个阶段都有定义', () => {
    const phases: GeneratingPhase[] = ['idle', 'setting', 'writing', 'editing', 'done'];
    expect(Object.keys(VALID_PHASE_TRANSITIONS)).toHaveLength(5);
    for (const phase of phases) {
      expect(VALID_PHASE_TRANSITIONS).toHaveProperty(phase);
    }
  });

  it('每个阶段的允许转换列表无重复', () => {
    for (const [phase, targets] of Object.entries(VALID_PHASE_TRANSITIONS)) {
      expect(new Set(targets).size, `${phase} 的转换列表有重复`).toBe(targets.length);
    }
  });
});

describe('PROGRESS_PHASES', () => {
  it('包含 setting、writing、editing 三个阶段', () => {
    expect(PROGRESS_PHASES).toEqual(['setting', 'writing', 'editing']);
  });
});

describe('完整流程：setting → writing → editing → done', () => {
  it('模拟一次完整的生成流水线', () => {
    let phase: GeneratingPhase = 'idle';

    phase = getNextPhase(phase, { type: 'START_SETTING' })!;
    expect(phase).toBe('setting');

    phase = getNextPhase(phase, { type: 'START_WRITING' })!;
    expect(phase).toBe('writing');

    phase = getNextPhase(phase, { type: 'START_EDITING' })!;
    expect(phase).toBe('editing');

    phase = getNextPhase(phase, { type: 'COMPLETE' })!;
    expect(phase).toBe('done');

    phase = getNextPhase(phase, { type: 'RESET' })!;
    expect(phase).toBe('idle');
  });

  it('模拟生成中途 ERROR 中断后重试', () => {
    let phase: GeneratingPhase = 'idle';

    phase = getNextPhase(phase, { type: 'START_SETTING' })!;
    expect(phase).toBe('setting');

    phase = getNextPhase(phase, { type: 'START_WRITING' })!;
    expect(phase).toBe('writing');

    phase = getNextPhase(phase, { type: 'ERROR' })!;
    expect(phase).toBe('idle');

    phase = getNextPhase(phase, { type: 'START_SETTING' })!;
    expect(phase).toBe('setting');
  });
});
/**
 * 生成阶段状态机
 *
 * 定义 AI 场景生成的阶段流转规则，确保合法的状态转换，
 * 防止非法跳转（如 writing 直接跳到 done）。
 *
 * 状态流转图：
 *   idle → setting → writing → editing → done
 *     ↑       ↑         ↑         ↑        ↑
 *     └───────┴─────────┴─────────┴────────┘
 *             error / abort / reset
 */

/** 生成阶段类型 */
export type GeneratingPhase = 'idle' | 'setting' | 'writing' | 'editing' | 'done';

/** 有效的状态转换映射 */
export const VALID_PHASE_TRANSITIONS: Record<GeneratingPhase, GeneratingPhase[]> = {
  idle: ['setting'],
  setting: ['writing', 'idle'],
  writing: ['editing', 'idle'],
  editing: ['done', 'idle'],
  done: ['idle'],
};

/** 状态转换事件 */
export type PhaseEvent =
  | { type: 'START_SETTING' }
  | { type: 'START_WRITING' }
  | { type: 'START_EDITING' }
  | { type: 'COMPLETE' }
  | { type: 'ERROR'; message?: string }
  | { type: 'ABORT' }
  | { type: 'RESET' };

/** 事件到目标阶段的映射 */
export function eventToPhase(event: PhaseEvent): GeneratingPhase {
  switch (event.type) {
    case 'START_SETTING':
      return 'setting';
    case 'START_WRITING':
      return 'writing';
    case 'START_EDITING':
      return 'editing';
    case 'COMPLETE':
      return 'done';
    case 'ERROR':
    case 'ABORT':
    case 'RESET':
      return 'idle';
  }
}

/**
 * 计算下一个阶段
 *
 * 根据当前阶段和事件，返回合法的下一个阶段。
 * 如果转换非法，返回 null 并在控制台输出警告。
 *
 * @example
 *   getNextPhase('idle', { type: 'START_SETTING' })    // → 'setting'
 *   getNextPhase('writing', { type: 'COMPLETE' })       // → null（非法：writing 不能直接到 done）
 *   getNextPhase('editing', { type: 'COMPLETE' })       // → 'done'
 */
export function getNextPhase(
  currentPhase: GeneratingPhase,
  event: PhaseEvent,
): GeneratingPhase | null {
  const targetPhase = eventToPhase(event);

  if (currentPhase === targetPhase) {
    return targetPhase;
  }

  if (VALID_PHASE_TRANSITIONS[currentPhase].includes(targetPhase)) {
    return targetPhase;
  }

  console.warn(
    `[PhaseMachine] 非法状态转换: "${currentPhase}" → "${targetPhase}" (事件: ${event.type})`,
  );
  return null;
}

/**
 * 获取所有可用的生成阶段（用于 UI 进度指示器）
 */
export const PROGRESS_PHASES: GeneratingPhase[] = ['setting', 'writing', 'editing'];

/**
 * 阶段显示配置
 */
export const PHASE_DISPLAY: Record<string, { icon: string; label: string }> = {
  setting: { icon: '⚙️', label: '设定 Agent 正在分析场景设定...' },
  writing: { icon: '✍️', label: '写作 Agent 正在撰写正文...' },
  editing: { icon: '🔍', label: '编辑 Agent 正在审校修订...' },
};

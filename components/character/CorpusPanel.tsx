'use client';

import type { CharacterProfile } from '@/lib/types';

const SOURCE_LABEL: Record<string, string> = {
  manual: '手动录入',
  script_extract: '脚本提取',
  scene: '场景生成',
  chat: '对话训练',
  interview: '访谈收集',
  preference: '三选一',
  import: '导入',
};

interface CorpusPanelProps {
  char: CharacterProfile;
  onDeleteSample: (sampleId: string) => void;
  onClose: () => void;
}

export default function CorpusPanel({ char, onDeleteSample, onClose }: CorpusPanelProps) {
  const samples = char.voiceCorpus || [];

  return (
    <div className="border-t border-academia-gold/20 shrink-0">
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-academia-gold uppercase tracking-wider">
            示例库 · {samples.length} 条
          </span>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="text-[10px] text-academia-muted hover:text-academia-parchment transition-colors"
          >
            ✕ 收起
          </button>
        </div>
        {samples.length === 0 ? (
          <p className="text-[9px] text-academia-muted/60 py-2 text-center">
            暂无示例，点击下方「+收集」开始构建角色声线库。
          </p>
        ) : (
          <div className="space-y-1.5 max-h-[250px] overflow-y-auto custom-scrollbar">
            {samples.map((s) => (
              <div key={s.id} className="rounded bg-academia-bg/50 border border-academia-border/30 p-2 group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-academia-parchment/80">
                    {s.scenarioLabel || s.scenario}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] text-academia-muted/40 bg-academia-bg px-1 rounded">
                      {SOURCE_LABEL[s.source] || s.source}
                    </span>
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => onDeleteSample(s.id)}
                      className="text-[8px] text-academia-muted/30 hover:text-red-400 transition-colors px-0.5 opacity-0 group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {s.axis && (
                  <span className="text-[9px] text-academia-gold/60 bg-academia-bg/80 px-1 rounded mr-1">
                    {s.axis}
                  </span>
                )}
                {s.hypothesis && (
                  <span className="text-[9px] text-academia-muted/40">
                    {s.hypothesis}
                  </span>
                )}
                <div className="mt-1 text-[9px] text-academia-parchment/60 leading-relaxed line-clamp-2">
                  {s.lines.map((l) => `${l.speaker === 'self' ? char.name || '角色' : l.speaker}：${l.text}`).join(' | ')}
                </div>
                <div className="mt-1 text-[8px] text-academia-muted/30">
                  {s.lines.length} 句 · {s.lines.reduce((n, l) => n + l.text.length, 0)} 字
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import type { CorpusLine } from '@/lib/types';
import { getScenarioPresets } from '@/lib/services/corpus.service';

interface CollectVariant {
  axis: string;
  hypothesis: string;
  lines: CorpusLine[];
}

interface CollectPanelProps {
  step: 'picking' | 'loading' | 'choosing';
  charName: string;
  scenarioLabel: string;
  variants: CollectVariant[] | null;
  onScenarioPick: (key: string, label: string) => void;
  onVariantSelect: (index: number) => void;
  onCancel: () => void;
}

export default function CollectPanel({
  step,
  charName,
  scenarioLabel,
  variants,
  onScenarioPick,
  onVariantSelect,
  onCancel,
}: CollectPanelProps) {
  return (
    <div className="border-t border-academia-gold/20 shrink-0">
      {step === 'picking' && (
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-academia-gold uppercase tracking-wider">
              选择场景
            </span>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={onCancel}
              className="text-[10px] text-academia-muted hover:text-academia-parchment transition-colors"
            >
              ✕ 取消
            </button>
          </div>
          <p className="text-[9px] text-academia-muted/60">
            AI 将在你选择的场景下，为「{charName || '该角色'}」生成 3 组不同声线方向的对白供你挑选。
          </p>
          <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
            {Object.entries(getScenarioPresets()).map(([key, label]) => (
              <button
                key={key}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => onScenarioPick(key, label)}
                className="text-left text-[11px] px-2.5 py-1.5 rounded bg-academia-bg/50 border border-academia-border/30 text-academia-parchment/80 hover:border-academia-gold/40 hover:text-academia-gold transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'loading' && (
        <div className="p-4 flex flex-col items-center justify-center space-y-3">
          <div className="w-6 h-6 border-2 border-academia-gold/30 border-t-academia-gold rounded-full animate-spin" />
          <span className="text-[10px] text-academia-muted">
            AI 正在生成「{scenarioLabel}」场景下的 3 组对白变体……
          </span>
        </div>
      )}

      {step === 'choosing' && variants && (
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-academia-gold uppercase tracking-wider">
              选择声线 · {scenarioLabel}
            </span>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={onCancel}
              className="text-[10px] text-academia-muted hover:text-academia-parchment transition-colors"
            >
              ✕ 取消
            </button>
          </div>
          <p className="text-[9px] text-academia-muted/60">
            点击你认为最符合「{charName || '该角色'}」声线的一组对白，存入示例库。
          </p>
          <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar">
            {variants.map((v, i) => (
              <button
                key={i}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => onVariantSelect(i)}
                className="w-full text-left p-2.5 rounded bg-academia-bg/50 border border-academia-border/30 hover:border-academia-gold/50 hover:bg-academia-bg transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] text-academia-gold/80 font-bold">
                    变体 {['一', '二', '三'][i]}
                  </span>
                  <span className="text-[10px] text-academia-parchment/70 bg-academia-bg/80 px-1.5 py-0.5 rounded">
                    {v.axis || '未标注'}
                  </span>
                </div>
                {v.hypothesis && (
                  <p className="text-[9px] text-academia-muted/50 mb-1.5 leading-relaxed">
                    🎭 {v.hypothesis}
                  </p>
                )}
                <div className="space-y-0.5 text-[10px] text-academia-parchment/80 leading-relaxed">
                  {v.lines.slice(0, 8).map((l, li) => (
                    <p key={li} className="flex gap-1.5">
                      <span className="text-academia-muted/60 shrink-0 w-10 text-right">
                        {l.speaker === 'self' ? charName || '角色' : l.speaker}
                      </span>
                      <span>{l.text}</span>
                    </p>
                  ))}
                  {v.lines.length > 8 && (
                    <p className="text-[9px] text-academia-muted/40 pl-11">
                      …共 {v.lines.length} 句
                    </p>
                  )}
                </div>
                <div className="mt-2 text-[9px] text-academia-gold/40 group-hover:text-academia-gold/70 transition-colors text-right">
                  点击选择此变体 →
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
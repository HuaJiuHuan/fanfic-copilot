'use client';

import type { CharacterProfile } from '@/lib/types';
import { getStrategyDisplay, dialogueWritePolicy } from '@/lib/services/corpus.service';

interface CharacterBottomBarProps {
  char: CharacterProfile | null;
  showCorpusPanel: boolean;
  confirmDelete: boolean;
  hasMultiple: boolean;
  onToggleCorpus: () => void;
  onCollect: () => void;
  onExtract: () => void;
  onImprov: () => void;
  onRemove: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

export default function CharacterBottomBar({
  char,
  showCorpusPanel,
  confirmDelete,
  hasMultiple,
  onToggleCorpus,
  onCollect,
  onExtract,
  onImprov,
  onRemove,
  onConfirmDelete,
  onCancelDelete,
}: CharacterBottomBarProps) {
  if (!char) {
    return (
      <div className="border-t border-academia-border/50 px-4 py-2 shrink-0">
        <span className="text-[10px] text-academia-muted">角色工坊</span>
      </div>
    );
  }

  const corpusCount = char.voiceCorpus?.length ?? 0;
  const strategy = dialogueWritePolicy(char.voiceCorpus, char.voice);
  const display = getStrategyDisplay(strategy);

  return (
    <div className="border-t border-academia-border/50 px-4 py-2 shrink-0 space-y-1">
      <div className="flex justify-between items-center text-[10px]">
        <span className="text-academia-muted flex items-center gap-2">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onToggleCorpus}
            className="hover:text-academia-parchment transition-colors"
          >
            📚 示例库：<span className="text-academia-parchment/60">{corpusCount} 条</span>
            <span className="text-[8px] text-academia-muted/40 ml-0.5">{showCorpusPanel ? '▲' : '▼'}</span>
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onCollect}
            className="text-[10px] text-academia-gold/60 hover:text-academia-gold transition-colors px-1.5 py-0.5 border border-academia-gold/20 hover:border-academia-gold/40 rounded"
            aria-label="收集示例"
          >
            +收集
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onImprov}
            className="text-[10px] text-academia-gold/60 hover:text-academia-gold transition-colors px-1.5 py-0.5 border border-purple-400/20 hover:border-purple-400/40 rounded"
            aria-label="言灵契定"
          >
            🎭 言灵契定
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onExtract}
            className="text-[10px] text-academia-gold/60 hover:text-academia-gold transition-colors px-1.5 py-0.5 border border-academia-muted/20 hover:border-academia-gold/40 rounded"
            aria-label="从文本提取示例"
          >
            📄 提取
          </button>
        </span>
        {hasMultiple && (
          !confirmDelete ? (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={onRemove}
              className="text-[10px] text-academia-muted/40 hover:text-red-400 transition-colors px-2 py-0.5"
              aria-label="删除当前角色"
              title="删除角色"
            >
              删除角色
            </button>
          ) : (
            <span className="flex items-center gap-1">
              <span className="text-[10px] text-red-400/70">
                删除「{char.name || '未命名'}」？
              </span>
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={onConfirmDelete}
                className="text-[10px] text-red-400 hover:text-red-300 transition-colors px-1"
              >
                确认
              </button>
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={onCancelDelete}
                className="text-[10px] text-academia-muted hover:text-academia-parchment transition-colors px-1"
              >
                取消
              </button>
            </span>
          )
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${display.color}`} />
        <span className="text-[10px] text-yellow-500/70">{display.label}</span>
      </div>
    </div>
  );
}
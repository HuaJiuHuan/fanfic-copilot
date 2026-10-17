'use client';

import type { CorpusLine } from '@/lib/types';
import { SOURCE_WEIGHTS } from '@/lib/types';

interface ExtractPanelProps {
  step: 'input' | 'loading' | 'review';
  charName: string;
  text: string;
  lines: CorpusLine[] | null;
  scenario: string;
  onTextChange: (v: string) => void;
  onSubmit: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry: () => void;
}

export default function ExtractPanel({
  step,
  charName,
  text,
  lines,
  scenario,
  onTextChange,
  onSubmit,
  onConfirm,
  onCancel,
  onRetry,
}: ExtractPanelProps) {
  if (step === 'input') {
    return (
      <div className="p-3 bg-academia-bg/40 border border-academia-gold/20 rounded-lg space-y-3">
        <p className="text-[11px] text-academia-parchment/80 font-bold">📄 从文本提取示例</p>
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="粘贴包含角色对话的文本，AI 将自动提取该角色的台词。&#10;&#10;支持格式：角色名：对话内容"
          className="w-full bg-academia-bg border border-academia-border rounded px-2.5 py-2 text-xs text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors resize-none"
          rows={8}
          onMouseDown={(e) => e.stopPropagation()}
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="text-[10px] px-3 py-1 rounded text-academia-muted hover:text-academia-parchment transition-colors"
          >
            取消
          </button>
          <button
            onClick={onSubmit}
            disabled={!text.trim() || !charName}
            className="text-[10px] px-3 py-1 rounded bg-academia-gold/80 text-academia-bg hover:bg-academia-gold transition-colors disabled:opacity-40"
          >
            提取台词
          </button>
        </div>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center py-8 gap-2">
        <div className="w-4 h-4 border-2 border-academia-gold/30 border-t-academia-gold rounded-full animate-spin" />
        <span className="text-[11px] text-academia-muted">AI 正在提取对话…</span>
      </div>
    );
  }

  if (step === 'review' && lines) {
    return (
      <div className="p-3 bg-academia-bg/40 border border-academia-gold/20 rounded-lg space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-[11px] text-academia-parchment/80 font-bold">
            📄 提取结果 <span className="text-academia-muted/60 font-normal">· {scenario}</span>
          </p>
          <span className="text-[10px] text-academia-muted">{lines.length} 句</span>
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
          {lines.map((l, i) => (
            <p key={i} className="text-[10px] text-academia-parchment/80 leading-relaxed flex gap-1.5">
              <span className="text-academia-muted/60 shrink-0">{l.speaker === 'self' ? charName || '角色' : l.speaker}</span>
              <span className="text-academia-muted/30">：</span>
              <span>{l.text}</span>
            </p>
          ))}
        </div>
        <span className="text-[9px] text-academia-muted/40 block">来源权重：{SOURCE_WEIGHTS.script_extract}（脚本提取）</span>
        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onRetry}
            className="text-[10px] px-3 py-1 rounded text-academia-muted hover:text-academia-parchment transition-colors"
          >
            重新提取
          </button>
          <button
            onClick={onConfirm}
            className="text-[10px] px-3 py-1 rounded bg-academia-gold/80 text-academia-bg hover:bg-academia-gold transition-colors"
          >
            存入示例库
          </button>
        </div>
      </div>
    );
  }

  return null;
}
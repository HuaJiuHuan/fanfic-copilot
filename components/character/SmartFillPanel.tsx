'use client';

interface SmartFillFields {
  name: string;
  voice: string;
  bio: string;
  relationships: string;
  coreMotivation: string;
}

interface SmartFillPanelProps {
  step: 'input' | 'loading' | 'review';
  description: string;
  fields: SmartFillFields | null;
  onDescChange: (v: string) => void;
  onSubmit: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry: () => void;
}

const FIELD_DEFS = [
  { label: '角色名', key: 'name' as const },
  { label: '语气标签', key: 'voice' as const },
  { label: '人设简介', key: 'bio' as const },
  { label: '角色关系', key: 'relationships' as const },
  { label: '核心动机', key: 'coreMotivation' as const },
];

export default function SmartFillPanel({
  step,
  description,
  fields,
  onDescChange,
  onSubmit,
  onConfirm,
  onCancel,
  onRetry,
}: SmartFillPanelProps) {
  if (step === 'input') {
    return (
      <div className="p-3 bg-academia-bg/40 border border-academia-gold/20 rounded-lg space-y-3">
        <p className="text-[11px] text-academia-parchment/80 font-bold">✨ 智能填充角色卡</p>
        <textarea
          value={description}
          onChange={(e) => onDescChange(e.target.value)}
          placeholder="简单描述角色，AI 自动填充所有字段。&#10;&#10;例如：一个表面冷漠内心温柔的剑客，对徒弟保护欲很强，说话简短带刺但行动诚实。"
          className="w-full bg-academia-bg border border-academia-border rounded px-2.5 py-2 text-xs text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors resize-none"
          rows={5}
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
            className="text-[10px] px-3 py-1 rounded bg-academia-gold/80 text-academia-bg hover:bg-academia-gold transition-colors"
          >
            生成角色卡
          </button>
        </div>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center py-8 gap-2">
        <div className="w-4 h-4 border-2 border-academia-gold/30 border-t-academia-gold rounded-full animate-spin" />
        <span className="text-[11px] text-academia-muted">AI 正在分析描述…</span>
      </div>
    );
  }

  if (step === 'review' && fields) {
    return (
      <div className="p-3 bg-academia-bg/40 border border-academia-gold/20 rounded-lg space-y-3">
        <p className="text-[11px] text-academia-parchment/80 font-bold">✨ 生成的角色卡</p>
        {FIELD_DEFS.map(({ label, key }) => (
          <div key={key} className="space-y-1">
            <span className="text-[9px] text-academia-muted uppercase">{label}</span>
            <p className="text-xs text-academia-parchment/80 bg-academia-bg/50 rounded p-2 leading-relaxed">
              {fields[key] || '(未生成)'}
            </p>
          </div>
        ))}
        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onRetry}
            className="text-[10px] px-3 py-1 rounded text-academia-muted hover:text-academia-parchment transition-colors"
          >
            重新生成
          </button>
          <button
            onClick={onConfirm}
            className="text-[10px] px-3 py-1 rounded bg-academia-gold/80 text-academia-bg hover:bg-academia-gold transition-colors"
          >
            确认填充
          </button>
        </div>
      </div>
    );
  }

  return null;
}
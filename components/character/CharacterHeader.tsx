'use client';

interface CharacterHeaderProps {
  activeIndex: number;
  totalChars: number;
  hasMultiple: boolean;
  onStartSmartFill: () => void;
  onAddCharacter: () => void;
  onNavigate: (dir: 'prev' | 'next') => void;
  onCollapse: () => void;
}

export default function CharacterHeader({
  activeIndex,
  totalChars,
  hasMultiple,
  onStartSmartFill,
  onAddCharacter,
  onNavigate,
  onCollapse,
}: CharacterHeaderProps) {
  return (
    <div className="flex justify-between items-center border-b border-academia-border/50 px-3 py-2 shrink-0 cursor-grab active:cursor-grabbing">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-bold text-academia-gold uppercase tracking-widest">
          角色工坊
        </h3>
        <span className="text-[10px] text-academia-muted">
          {totalChars > 0 ? `${activeIndex + 1}/${totalChars}` : '0/0'}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onStartSmartFill}
          className="text-[10px] text-academia-gold/60 hover:text-academia-gold transition-colors px-1.5"
          title="智能填充角色卡"
          aria-label="智能填充角色卡"
        >
          ✨
        </button>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onAddCharacter}
          className="text-xs w-5 h-5 rounded flex items-center justify-center text-academia-muted hover:text-academia-parchment hover:bg-academia-bg/50 transition-colors"
          aria-label="添加角色"
          title="添加角色"
        >
          +
        </button>
        {hasMultiple && (
          <>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => onNavigate('prev')}
              className="text-xs w-5 h-5 rounded flex items-center justify-center text-academia-muted hover:text-academia-parchment hover:bg-academia-bg/50 transition-colors"
              aria-label="上一个角色"
            >
              ‹
            </button>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => onNavigate('next')}
              className="text-xs w-5 h-5 rounded flex items-center justify-center text-academia-muted hover:text-academia-parchment hover:bg-academia-bg/50 transition-colors"
              aria-label="下一个角色"
            >
              ›
            </button>
          </>
        )}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onCollapse}
          className="text-xs text-academia-muted hover:text-academia-parchment transition-colors ml-1"
          aria-label="收起角色工坊"
        >
          ▸
        </button>
      </div>
    </div>
  );
}
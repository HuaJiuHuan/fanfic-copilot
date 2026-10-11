'use client';

import { memo, useState, useCallback, useRef, useEffect } from 'react';

interface FloatingArchiveProps {
  fandom: string;
  characters: string;
  premise: string;
}

const DRAG_THRESHOLD = 5;

export default memo(function FloatingArchive({
  fandom,
  characters,
  premise,
}: FloatingArchiveProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 120 });
  const prevExpandedRef = useRef(false);

  const dragRef = useRef({
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0,
    moved: false,
  });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPosX: position.x,
        startPosY: position.y,
        moved: false,
      };

      const handleMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;

        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
          dragRef.current.moved = true;
        }

        if (isExpanded) {
          const newX = dragRef.current.startPosX + dx;
          const newY = dragRef.current.startPosY + dy;
          const maxX = window.innerWidth - 280;
          const maxY = window.innerHeight - 100;
          setPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY)),
          });
        } else {
          const newY = dragRef.current.startPosY + dy;
          const maxY = window.innerHeight - 160;
          setPosition((prev) => ({
            ...prev,
            y: Math.max(0, Math.min(newY, maxY)),
          }));
        }
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);

        if (!dragRef.current.moved && !isExpanded) {
          const stripY = position.y;
          setPosition({
            x: Math.max(12, window.innerWidth / 2 - 140),
            y: Math.max(0, stripY - 50),
          });
          setIsExpanded(true);
        }
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [isExpanded, position],
  );

  const handleCollapse = useCallback(() => {
    const cardY = position.y;
    setIsExpanded(false);
    setPosition((prev) => ({
      ...prev,
      x: 0,
      y: Math.max(0, Math.min(cardY, window.innerHeight - 160)),
    }));
  }, [position]);

  useEffect(() => {
    if (prevExpandedRef.current && !isExpanded) {
      setPosition((prev) => ({ ...prev, x: 0 }));
    }
    prevExpandedRef.current = isExpanded;
  }, [isExpanded]);

  if (isExpanded) {
    return (
      <div
        className="fixed z-50 bg-academia-surface border border-academia-gold/30 rounded-xl p-5 shadow-2xl w-64 aspect-[3/4] select-none"
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex justify-between items-center border-b border-academia-border/50 pb-2 mb-3 cursor-grab active:cursor-grabbing">
          <h3 className="text-xs font-bold text-academia-gold uppercase tracking-widest">
            全局档案
          </h3>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleCollapse}
            className="text-xs text-academia-muted hover:text-academia-parchment transition-colors cursor-pointer"
            aria-label="收起全局档案"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] text-academia-muted uppercase">原著</span>
            <p className="text-sm">{fandom}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-academia-muted uppercase">角色</span>
            <p className="text-sm">{characters}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-academia-muted uppercase">核心脑洞</span>
            <p className="text-sm text-academia-muted leading-relaxed">{premise}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed z-50 left-0 bg-academia-surface border border-academia-border border-l-0 rounded-r-lg px-1.5 py-8 cursor-grab active:cursor-grabbing select-none shadow-lg hover:border-academia-gold/30 transition-colors"
      style={{ top: position.y }}
      onMouseDown={handleMouseDown}
    >
      <span
        className="text-xs text-academia-gold font-bold tracking-[0.3em]"
        style={{ writingMode: 'vertical-rl' }}
      >
        全局档案
      </span>
    </div>
  );
});
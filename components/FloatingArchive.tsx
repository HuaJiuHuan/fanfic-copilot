'use client';

import { memo, useState, useCallback, useRef } from 'react';
import { updateProjectAction } from '@/app/actions/project';

interface FloatingArchiveProps {
  fandom: string;
  characters: string;
  premise: string;
  projectId: string;
}

const DRAG_THRESHOLD = 5;
const INITIAL_SIZE = 300;
const MIN_SIZE = 200;
const MAX_SIZE = 600;

export default memo(function FloatingArchive({
  fandom: initialFandom,
  characters: initialCharacters,
  premise: initialPremise,
  projectId,
}: FloatingArchiveProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 120 });
  const [isEditing, setIsEditing] = useState(false);
  const [cardSize, setCardSize] = useState(INITIAL_SIZE);
  const [fandom, setFandom] = useState(initialFandom);
  const [characters, setCharacters] = useState(initialCharacters);
  const [premise, setPremise] = useState(initialPremise);

  const save = useCallback(
    async (f: string, c: string, p: string) => {
      await updateProjectAction(projectId, { fandom: f, characters: c, premise: p });
    },
    [projectId],
  );

  const dragRef = useRef({
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0,
    moved: false,
  });

  const stripYRef = useRef(120);

  const resizeRef = useRef({
    startX: 0,
    startY: 0,
    startSize: INITIAL_SIZE,
  });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isEditing) return;
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
          const maxX = window.innerWidth - cardSize;
          const maxY = window.innerHeight - cardSize;
          setPosition({
            x: Math.max(0, Math.min(dragRef.current.startPosX + dx, maxX)),
            y: Math.max(0, Math.min(dragRef.current.startPosY + dy, maxY)),
          });
        } else {
          const newY = dragRef.current.startPosY + dy;
          const maxY = window.innerHeight - 160;
          const clampedY = Math.max(0, Math.min(newY, maxY));
          stripYRef.current = clampedY;
          setPosition((prev) => ({
            ...prev,
            y: clampedY,
          }));
        }
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);

        if (!dragRef.current.moved && !isExpanded) {
          stripYRef.current = position.y;
          setPosition({
            x: Math.max(12, window.innerWidth / 2 - cardSize / 2),
            y: Math.max(0, position.y - 50),
          });
          setIsExpanded(true);
        }
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [isExpanded, position, cardSize, isEditing],
  );

  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
    setPosition({ x: 0, y: Math.max(0, Math.min(stripYRef.current, window.innerHeight - 160)) });
  }, []);

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startSize: cardSize,
      };

      const handleMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - resizeRef.current.startX;
        const dy = ev.clientY - resizeRef.current.startY;
        const delta = Math.max(dx, dy);
        const newSize = Math.max(MIN_SIZE, Math.min(MAX_SIZE, resizeRef.current.startSize + delta));
        setCardSize(newSize);
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [cardSize],
  );

  if (isExpanded) {
    return (
      <div
        className="fixed z-50 bg-academia-surface border border-academia-gold/30 rounded-xl p-5 shadow-2xl select-none overflow-hidden flex flex-col"
        style={{ left: position.x, top: position.y, width: cardSize, height: cardSize }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex justify-between items-center border-b border-academia-border/50 pb-2 mb-3 shrink-0 cursor-grab active:cursor-grabbing">
          <h3 className="text-xs font-bold text-academia-gold uppercase tracking-widest">
            全局档案
          </h3>
          <div className="flex items-center gap-2">
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setIsEditing(!isEditing)}
              className={`text-[10px] transition-colors ${isEditing ? 'text-academia-gold' : 'text-academia-muted hover:text-academia-parchment'}`}
              aria-label={isEditing ? '完成编辑' : '编辑全局档案'}
            >
              {isEditing ? '✓ 完成' : '✎ 编辑'}
            </button>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleCollapse}
              className="text-xs text-academia-muted hover:text-academia-parchment transition-colors cursor-pointer"
              aria-label="收起全局档案"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto">
          <div className="space-y-1">
            <span className="text-[10px] text-academia-muted uppercase">原著</span>
            {isEditing ? (
              <input
                value={fandom}
                onChange={(e) => setFandom(e.target.value)}
                onBlur={() => save(fandom, characters, premise)}
                className="w-full bg-academia-bg border border-academia-border rounded px-2 py-1 text-sm text-academia-parchment outline-none focus:border-academia-gold/50"
                onMouseDown={(e) => e.stopPropagation()}
              />
            ) : (
              <p className="text-sm">{fandom}</p>
            )}
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-academia-muted uppercase">角色</span>
            {isEditing ? (
              <input
                value={characters}
                onChange={(e) => setCharacters(e.target.value)}
                onBlur={() => save(fandom, characters, premise)}
                className="w-full bg-academia-bg border border-academia-border rounded px-2 py-1 text-sm text-academia-parchment outline-none focus:border-academia-gold/50"
                onMouseDown={(e) => e.stopPropagation()}
              />
            ) : (
              <p className="text-sm">{characters}</p>
            )}
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-academia-muted uppercase">核心脑洞</span>
            {isEditing ? (
              <textarea
                value={premise}
                onChange={(e) => setPremise(e.target.value)}
                onBlur={() => save(fandom, characters, premise)}
                className="w-full bg-academia-bg border border-academia-border rounded px-2 py-1 text-sm text-academia-parchment outline-none focus:border-academia-gold/50 resize-none leading-relaxed"
                rows={4}
                onMouseDown={(e) => e.stopPropagation()}
              />
            ) : (
              <p className="text-sm text-academia-muted leading-relaxed">{premise}</p>
            )}
          </div>
        </div>

        <div
          className="absolute bottom-1 right-1 w-4 h-4 cursor-nwse-resize text-academia-border/40 hover:text-academia-gold/60 transition-colors flex items-center justify-center"
          onMouseDown={handleResizeMouseDown}
          aria-label="拖拽调整卡片大小"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M0 10 L10 0 L10 10 Z" />
          </svg>
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
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { CorpusLine } from '@/lib/types';

interface ImprovMessage {
  role: 'user' | 'character';
  text: string;
}

interface ImprovPanelProps {
  charName: string;
  userName: string;
  messages: ImprovMessage[];
  input: string;
  isSending: boolean;
  onInputChange: (v: string) => void;
  onSend: (text: string) => void;
  onSaveLine: (line: CorpusLine) => void;
  onCancel: () => void;
}

const MIN_PANEL_HEIGHT = 160;
const DEFAULT_PANEL_HEIGHT = 200;

export default function ImprovPanel({
  charName,
  userName,
  messages,
  input,
  isSending,
  onInputChange,
  onSend,
  onSaveLine,
  onCancel,
}: ImprovPanelProps) {
  const [panelHeight, setPanelHeight] = useState(DEFAULT_PANEL_HEIGHT);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isSending) return;
    onInputChange('');
    onSend(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const startY = e.clientY;
      const startHeight = panelHeight;

      const handleMouseMove = (ev: MouseEvent) => {
        const delta = startY - ev.clientY;
        const newHeight = Math.max(MIN_PANEL_HEIGHT, startHeight + delta);
        setPanelHeight(newHeight);
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [panelHeight],
  );

  return (
    <div
      className="border-t border-academia-gold/20 shrink-0 flex flex-col"
      style={{ height: panelHeight }}
    >
      <div
        className="h-1.5 cursor-ns-resize flex items-center justify-center group/resize hover:bg-academia-gold/10 transition-colors shrink-0"
        onMouseDown={handleResizeStart}
      >
        <div className="w-8 h-0.5 rounded-full bg-academia-border/30 group-hover/resize:bg-academia-gold/40 transition-colors" />
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-b border-academia-border/30 shrink-0">
        <span className="text-[10px] text-academia-gold uppercase tracking-wider">
          🎭 言灵契定
        </span>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onCancel}
          className="text-[10px] text-academia-muted hover:text-academia-parchment transition-colors"
        >
          ✕ 结束
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-2 min-h-0"
      >
        {messages.length === 0 && (
          <p className="text-[9px] text-academia-muted/60 text-center py-4">
            输入一句话，与「{charName || '角色'}」自由对话。
            <br />
            每轮 AI 回复可独立存入示例库。
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[80%]">
              <div
                className={`text-[11px] px-2.5 py-1.5 rounded-lg leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-academia-gold/15 text-academia-parchment/80'
                    : 'bg-academia-bg/80 border border-academia-border/30 text-academia-parchment/90'
                }`}
              >
                <span className="text-[9px] text-academia-muted/60 block mb-0.5">
                  {m.role === 'user' ? userName : charName || '角色'}
                </span>
                {m.text}
              </div>
              {m.role === 'character' && (
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => onSaveLine({ speaker: 'self', text: m.text })}
                  className="text-[9px] text-academia-gold/60 hover:text-academia-gold transition-colors px-1 mt-0.5"
                >
                  ⊕ 存入示例库
                </button>
              )}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-academia-bg/80 border border-academia-border/30 rounded-lg px-2.5 py-1.5 text-[11px] text-academia-muted/60">
              {charName || '角色'} 正在……
            </div>
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-academia-border/30 space-y-1 shrink-0">
        <div className="flex gap-1.5">
          <input
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder={`对「${charName || '角色'}」说点什么……`}
            disabled={isSending}
            className="flex-1 bg-academia-bg border border-academia-border rounded-lg px-2.5 py-1.5 text-[11px] text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors placeholder:text-academia-muted/30 disabled:opacity-40"
          />
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="text-[10px] px-3 py-1.5 rounded-lg bg-academia-gold/80 text-academia-bg hover:bg-academia-gold transition-colors shrink-0 disabled:opacity-30"
          >
            发送
          </button>
        </div>
        <p className="text-[8px] text-academia-muted/30 text-center">
          拖动顶部横条可调整面板高度，按 Enter 发送
        </p>
      </div>
    </div>
  );
}
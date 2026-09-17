'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toggleSubscription } from '@/app/actions/interaction';
import { getUserSubscriptions } from '@/app/actions/interaction';

interface SubscribeButtonProps {
  authorId: string;
  authorName: string;
  projectId: string;
  projectTitle: string;
}

export default function SubscribeButton({
  authorId,
  authorName,
  projectId,
  projectTitle,
}: SubscribeButtonProps) {
  const [open, setOpen] = useState(false);
  const [subscribedAuthor, setSubscribedAuthor] = useState(false);
  const [subscribedProject, setSubscribedProject] = useState(false);
  const [pending, setPending] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUserSubscriptions().then((subs) => {
      setSubscribedAuthor(subs.some((s) => s.targetType === 'author' && s.targetId === authorId));
      setSubscribedProject(
        subs.some((s) => s.targetType === 'project' && s.targetId === projectId),
      );
    });
  }, [authorId, projectId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [open]);

  const handleSubscribe = useCallback(
    async (targetType: 'author' | 'project', targetId: string) => {
      if (pending) return;
      setPending(true);

      const isAuthor = targetType === 'author';
      const prev = isAuthor ? subscribedAuthor : subscribedProject;
      if (isAuthor) setSubscribedAuthor(!prev);
      else setSubscribedProject(!prev);

      const result = await toggleSubscription(targetType, targetId);
      if (!result.success) {
        if (isAuthor) setSubscribedAuthor(prev);
        else setSubscribedProject(prev);
      }

      setPending(false);
      setOpen(false);
    },
    [pending, subscribedAuthor, subscribedProject, authorId, projectId],
  );

  const hasAnySubscription = subscribedAuthor || subscribedProject;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border transition-all duration-200 ${
          hasAnySubscription
            ? 'bg-academia-gold/10 text-academia-gold border-academia-gold/30'
            : 'bg-academia-surface text-academia-muted border-academia-border hover:border-academia-gold/30 hover:text-academia-gold'
        }`}
        aria-label="订阅"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={hasAnySubscription ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5"
          aria-hidden="true"
        >
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h8l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
        订阅
        {(subscribedAuthor || subscribedProject) && (
          <span className="text-[10px]">
            ({[subscribedAuthor && '作者', subscribedProject && '作品'].filter(Boolean).join('·')})
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-44 bg-academia-surface border border-academia-border rounded-xl shadow-lg z-50 overflow-hidden">
          <button
            type="button"
            onClick={() => handleSubscribe('author', authorId)}
            disabled={pending}
            className="w-full text-left px-3 py-2.5 text-xs hover:bg-academia-bg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <span
              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                subscribedAuthor
                  ? 'bg-academia-gold/20 border-academia-gold/40 text-academia-gold'
                  : 'border-academia-border text-transparent'
              }`}
            >
              ✓
            </span>
            <div>
              <span className="text-academia-parchment">订阅作者</span>
              <p className="text-[10px] text-academia-muted/50">{authorName}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleSubscribe('project', projectId)}
            disabled={pending}
            className="w-full text-left px-3 py-2.5 text-xs hover:bg-academia-bg transition-colors flex items-center gap-2 border-t border-academia-border/50 disabled:opacity-50"
          >
            <span
              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                subscribedProject
                  ? 'bg-academia-gold/20 border-academia-gold/40 text-academia-gold'
                  : 'border-academia-border text-transparent'
              }`}
            >
              ✓
            </span>
            <div>
              <span className="text-academia-parchment">订阅作品更新</span>
              <p className="text-[10px] text-academia-muted/50 truncate max-w-[140px]">
                {projectTitle}
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
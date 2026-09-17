'use client';

import { useState, useCallback } from 'react';
import { toggleKudos, toggleBookmark } from '@/app/actions/interaction';
import type { InteractionState } from '@/lib/types';

interface InteractionBarProps {
  projectId: string;
  initialState: InteractionState;
}

export default function InteractionBar({ projectId, initialState }: InteractionBarProps) {
  const [kudosCount, setKudosCount] = useState(initialState.kudosCount);
  const [isKudosed, setIsKudosed] = useState(initialState.isKudosed);
  const [bookmarkCount, setBookmarkCount] = useState(initialState.bookmarkCount);
  const [isBookmarked, setIsBookmarked] = useState(initialState.isBookmarked);
  const [kudosPending, setKudosPending] = useState(false);
  const [bookmarkPending, setBookmarkPending] = useState(false);

  const handleKudos = useCallback(async () => {
    if (kudosPending) return;
    setKudosPending(true);

    const previousState = { kudosCount, isKudosed };
    setKudosCount((prev) => (isKudosed ? prev - 1 : prev + 1));
    setIsKudosed((prev) => !prev);

    const result = await toggleKudos(projectId);
    if (!result.success) {
      setKudosCount(previousState.kudosCount);
      setIsKudosed(previousState.isKudosed);
    }

    setKudosPending(false);
  }, [projectId, kudosPending, kudosCount, isKudosed]);

  const handleBookmark = useCallback(async () => {
    if (bookmarkPending) return;
    setBookmarkPending(true);

    const previousState = { bookmarkCount, isBookmarked };
    setBookmarkCount((prev) => (isBookmarked ? prev - 1 : prev + 1));
    setIsBookmarked((prev) => !prev);

    const result = await toggleBookmark(projectId);
    if (!result.success) {
      setBookmarkCount(previousState.bookmarkCount);
      setIsBookmarked(previousState.isBookmarked);
    }

    setBookmarkPending(false);
  }, [projectId, bookmarkPending, bookmarkCount, isBookmarked]);

  return (
    <div className="flex items-center gap-1" role="group" aria-label="互动操作">
      <button
        type="button"
        onClick={handleKudos}
        disabled={kudosPending}
        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border transition-all duration-200 ${
          isKudosed
            ? 'bg-academia-gold/10 text-academia-gold border-academia-gold/30'
            : 'bg-academia-surface text-academia-muted border-academia-border hover:border-academia-gold/30 hover:text-academia-gold'
        } ${kudosPending ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
        aria-label={isKudosed ? '取消点赞' : '点赞'}
      >
        <HeartIcon filled={isKudosed} />
        <span className="tabular-nums">{kudosCount}</span>
      </button>

      <button
        type="button"
        onClick={handleBookmark}
        disabled={bookmarkPending}
        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border transition-all duration-200 ${
          isBookmarked
            ? 'bg-academia-gold/10 text-academia-gold border-academia-gold/30'
            : 'bg-academia-surface text-academia-muted border-academia-border hover:border-academia-gold/30 hover:text-academia-gold'
        } ${bookmarkPending ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
        aria-label={isBookmarked ? '取消收藏' : '收藏'}
      >
        <BookmarkIcon filled={isBookmarked} />
        <span className="tabular-nums">{bookmarkCount}</span>
      </button>

      <span
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border bg-academia-surface text-academia-muted border-academia-border"
        aria-label={`${initialState.commentCount} 条评论`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="tabular-nums">{initialState.commentCount}</span>
      </span>
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`w-3.5 h-3.5 transition-transform duration-200 ${
        filled ? 'scale-110' : ''
      }`}
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`w-3.5 h-3.5 transition-transform duration-200 ${
        filled ? 'scale-110' : ''
      }`}
      aria-hidden="true"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}
'use client';

import { useState, useCallback, useEffect } from 'react';
import { toggleSubscription } from '@/app/actions/interaction';
import { getUserSubscriptions } from '@/app/actions/interaction';

interface SubscribeButtonProps {
  authorId: string;
  authorName: string;
  projectId: string;
  projectTitle: string;
  initialSubCount: number;
}

export default function SubscribeButton({
  authorId,
  authorName,
  projectId,
  projectTitle,
  initialSubCount,
}: SubscribeButtonProps) {
  const [subscribedAuthor, setSubscribedAuthor] = useState(false);
  const [subscribedProject, setSubscribedProject] = useState(false);
  const [subCount, setSubCount] = useState(initialSubCount);
  const [pendingAuthor, setPendingAuthor] = useState(false);
  const [pendingProject, setPendingProject] = useState(false);

  useEffect(() => {
    getUserSubscriptions().then((subs) => {
      setSubscribedAuthor(subs.some((s) => s.targetType === 'author' && s.targetId === authorId));
      setSubscribedProject(
        subs.some((s) => s.targetType === 'project' && s.targetId === projectId),
      );
    });
  }, [authorId, projectId]);

  const handleAuthor = useCallback(async () => {
    if (pendingAuthor) return;
    setPendingAuthor(true);
    const prev = subscribedAuthor;
    setSubscribedAuthor(!prev);

    const result = await toggleSubscription('author', authorId);
    if (!result.success) {
      setSubscribedAuthor(prev);
    }
    setPendingAuthor(false);
  }, [pendingAuthor, subscribedAuthor, authorId]);

  const handleProject = useCallback(async () => {
    if (pendingProject) return;
    setPendingProject(true);
    const prev = subscribedProject;
    setSubscribedProject(!prev);

    const result = await toggleSubscription('project', projectId);
    if (!result.success) {
      setSubscribedProject(prev);
    } else {
      setSubCount(result.subscriptionCount);
    }
    setPendingProject(false);
  }, [pendingProject, subscribedProject, projectId]);

  return (
    <div className="flex items-center gap-1" role="group" aria-label="订阅操作">
      <button
        type="button"
        onClick={handleAuthor}
        disabled={pendingAuthor}
        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border transition-all duration-200 ${
          subscribedAuthor
            ? 'bg-academia-gold/10 text-academia-gold border-academia-gold/30'
            : 'bg-academia-surface text-academia-muted border-academia-border hover:border-academia-gold/30 hover:text-academia-gold'
        } ${pendingAuthor ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
        aria-label={subscribedAuthor ? `取消订阅作者 ${authorName}` : `订阅作者 ${authorName}`}
        title={subscribedAuthor ? `取消订阅 ${authorName}` : `订阅 ${authorName}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={subscribedAuthor ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5"
          aria-hidden="true"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        订阅作者
      </button>

      <button
        type="button"
        onClick={handleProject}
        disabled={pendingProject}
        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border transition-all duration-200 ${
          subscribedProject
            ? 'bg-academia-gold/10 text-academia-gold border-academia-gold/30'
            : 'bg-academia-surface text-academia-muted border-academia-border hover:border-academia-gold/30 hover:text-academia-gold'
        } ${pendingProject ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
        aria-label={subscribedProject ? `取消订阅作品 ${projectTitle}` : `订阅作品 ${projectTitle}`}
        title={subscribedProject ? `取消订阅《${projectTitle}》` : `订阅《${projectTitle}》`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={subscribedProject ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3.5 h-3.5"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span className="tabular-nums">{subCount}</span> 订阅
      </button>
    </div>
  );
}
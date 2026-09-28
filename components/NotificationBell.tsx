'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/app/actions/notifications';
import type { NotificationWithActor } from '@/lib/types';

function getRelativeTime(date: Date | null): string {
  if (!date) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}小时前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN');
}

function getNotificationText(type: string, actorName: string | null): string {
  const name = actorName || '匿名用户';
  switch (type) {
    case 'kudos':
      return `${name} 赞了你的作品`;
    case 'bookmark':
      return `${name} 收藏了你的作品`;
    case 'comment_project':
      return `${name} 评论了你的作品`;
    case 'comment_reply':
      return `${name} 回复了你的评论`;
    case 'subscription_author':
      return `${name} 发布了新作品`;
    case 'subscription_project':
      return '你订阅的作品有更新了';
    default:
      return '你有一条新通知';
  }
}

function getNotificationLink(type: string, projectId: string | null, commentId: string | null): string {
  if (!projectId) return '#';
  const base = `/story/${projectId}`;
  if (type === 'comment_reply' && commentId) {
    return `${base}#comment-${commentId}`;
  }
  return base;
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case 'kudos':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-academia-crimson shrink-0">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case 'bookmark':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-academia-gold shrink-0">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'comment_project':
    case 'comment_reply':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-academia-blue shrink-0">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'subscription_author':
    case 'subscription_project':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-academia-green shrink-0">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-academia-muted shrink-0">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    const count = await getUnreadCount();
    setUnreadCount(count);
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const list = await getNotifications();
    setNotifications(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleToggle = async () => {
    if (!open) {
      await fetchNotifications();
    }
    setOpen(!open);
  };

  const handleItemClick = async (notification: NotificationWithActor) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
      );
    }
    setOpen(false);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const hasUnread = unreadCount > 0;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={handleToggle}
        className={`relative w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
          hasUnread
            ? 'bg-academia-gold/10 border-academia-gold/30 text-academia-gold'
            : 'bg-academia-surface border-academia-border text-academia-muted hover:text-academia-gold hover:border-academia-gold/40'
        }`}
        aria-label={`通知${hasUnread ? `（${unreadCount} 条未读）` : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-academia-crimson text-[9px] font-bold text-white flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-academia-surface border border-academia-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-academia-border">
            <h3 className="text-xs font-bold text-academia-gold">通知</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[10px] text-academia-muted hover:text-academia-parchment transition-colors"
              >
                全部标为已读
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-xs text-academia-muted">
                加载中...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-xs text-academia-muted/60">
                <p>暂无通知</p>
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={getNotificationLink(n.type, n.projectId, n.commentId)}
                  onClick={(e) => {
                    e.preventDefault();
                    handleItemClick(n).then(() => {
                      window.location.href = getNotificationLink(n.type, n.projectId, n.commentId);
                    });
                  }}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-academia-bg/50 transition-colors border-b border-academia-border/30 last:border-b-0 ${
                    !n.isRead ? 'bg-academia-gold/5' : ''
                  }`}
                >
                  <div className="mt-0.5">
                    <NotificationIcon type={n.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs leading-relaxed ${
                        !n.isRead ? 'text-academia-parchment font-medium' : 'text-academia-muted'
                      }`}
                    >
                      {getNotificationText(n.type, n.actorName)}
                    </p>
                    <p className="text-[10px] text-academia-muted/50 mt-0.5">
                      {getRelativeTime(n.createdAt)}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-academia-gold shrink-0 mt-1.5" />
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
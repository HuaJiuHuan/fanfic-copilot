'use client';

import { useState, useCallback, useEffect } from 'react';
import { getComments, addComment, deleteComment } from '@/app/actions/comments';
import type { CommentWithUser } from '@/lib/types';

interface CommentSectionProps {
  projectId: string;
}

function getRelativeTime(date: Date | null): string {
  if (!date) return '未知';
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

export default function CommentSection({ projectId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadComments = useCallback(async () => {
    const data = await getComments(projectId);
    setComments(data);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    setError('');

    const result = await addComment(projectId, newComment);
    if (result.success) {
      setNewComment('');
      await loadComments();
    } else {
      setError(result.error || '发表评论失败');
    }

    setSubmitting(false);
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim() || replySubmitting) return;

    setReplySubmitting(true);
    setError('');

    const result = await addComment(projectId, replyText, parentId);
    if (result.success) {
      setReplyText('');
      setReplyingTo(null);
      await loadComments();
    } else {
      setError(result.error || '回复失败');
    }

    setReplySubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const result = await deleteComment(commentId);
    if (result.success) {
      await loadComments();
    } else {
      setError(result.error || '删除失败');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: 'comment' | 'reply') => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (type === 'comment') handleSubmit();
      else if (replyingTo) handleReply(replyingTo);
    }
  };

  const totalCount = comments.reduce(
    (sum, c) => sum + 1 + c.replies.length,
    0,
  );

  return (
    <section className="space-y-6" aria-label="评论区">
      <div className="flex items-center gap-2 border-b border-academia-border/50 pb-3">
        <h3 className="text-sm font-serif font-bold text-academia-gold">
          评论
        </h3>
        <span className="text-[10px] text-academia-muted/60 tabular-nums">
          ({totalCount})
        </span>
      </div>

      {error && (
        <div className="text-xs text-academia-crimson bg-academia-crimson/5 border border-academia-crimson/20 rounded-lg px-3 py-2">
          {error}
          <button
            type="button"
            onClick={() => setError('')}
            className="ml-2 underline underline-offset-2 hover:opacity-80"
          >
            关闭
          </button>
        </div>
      )}

      <div className="space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'comment')}
          placeholder="写下你的评论... (Ctrl+Enter 发送)"
          rows={3}
          maxLength={2000}
          className="w-full bg-academia-surface border border-academia-border rounded-lg px-3 py-2 text-sm text-academia-parchment placeholder:text-academia-muted/50 focus:outline-none focus:border-academia-gold/40 focus:ring-1 focus:ring-academia-gold/20 resize-none transition-colors"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-academia-muted/50">
            {newComment.length}/2000
          </span>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!newComment.trim() || submitting}
            className="text-xs bg-academia-gold/10 text-academia-gold border border-academia-gold/20 rounded-lg px-4 py-1.5 hover:bg-academia-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? '发送中...' : '发表评论'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-academia-muted text-xs">
            加载评论中...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 text-academia-muted/60 text-xs border border-dashed border-academia-border rounded-xl">
            还没有评论，来抢沙发吧
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replyingTo={replyingTo}
              replyText={replyText}
              replySubmitting={replySubmitting}
              onReplyClick={setReplyingTo}
              onReplyChange={setReplyText}
              onReplySubmit={handleReply}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </section>
  );
}

function CommentItem({
  comment,
  replyingTo,
  replyText,
  replySubmitting,
  onReplyClick,
  onReplyChange,
  onReplySubmit,
  onDelete,
}: {
  comment: CommentWithUser;
  replyingTo: string | null;
  replyText: string;
  replySubmitting: boolean;
  onReplyClick: (id: string | null) => void;
  onReplyChange: (text: string) => void;
  onReplySubmit: (parentId: string) => void;
  onDelete: (id: string) => void;
}) {
  const isReplying = replyingTo === comment.id;
  const isDeleted = comment.isDeleted;

  const handleReplyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onReplySubmit(comment.id);
    }
  };

  return (
    <div className="space-y-3">
      <div
        className={`group rounded-xl p-3 ${
          isDeleted
            ? 'bg-academia-border/10'
            : 'bg-academia-surface border border-academia-border/50 hover:border-academia-border transition-colors'
        }`}
      >
        {isDeleted ? (
          <div className="flex items-center gap-2 text-xs text-academia-muted/50 italic">
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
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            该评论已被删除
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-academia-gold/10 border border-academia-gold/20 flex items-center justify-center text-[10px] text-academia-gold font-bold shrink-0">
                  {(comment.userName || '匿').charAt(0).toUpperCase()}
                </span>
                <span className="text-xs font-medium text-academia-parchment">
                  {comment.userName || '匿名用户'}
                </span>
                <span className="text-[10px] text-academia-muted/50">
                  {getRelativeTime(comment.createdAt)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                className="opacity-0 group-hover:opacity-100 text-[10px] text-academia-muted/40 hover:text-academia-crimson transition-all"
                aria-label="删除评论"
              >
                删除
              </button>
            </div>

            <p className="text-sm text-academia-parchment leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>

            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() =>
                  onReplyClick(isReplying ? null : comment.id)
                }
                className="text-[10px] text-academia-muted hover:text-academia-gold transition-colors"
              >
                {isReplying ? '取消回复' : '回复'}
              </button>
            </div>

            {isReplying && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={replyText}
                  onChange={(e) => onReplyChange(e.target.value)}
                  onKeyDown={handleReplyKeyDown}
                  placeholder={`回复 ${comment.userName || '匿名用户'}... (Ctrl+Enter 发送)`}
                  rows={2}
                  maxLength={2000}
                  className="w-full bg-academia-bg border border-academia-border rounded-lg px-3 py-1.5 text-xs text-academia-parchment placeholder:text-academia-muted/50 focus:outline-none focus:border-academia-gold/40 resize-none transition-colors"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onReplyClick(null)}
                    className="text-[10px] text-academia-muted hover:text-academia-parchment px-2 py-1"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => onReplySubmit(comment.id)}
                    disabled={!replyText.trim() || replySubmitting}
                    className="text-[10px] bg-academia-gold/10 text-academia-gold border border-academia-gold/20 rounded-lg px-3 py-1 hover:bg-academia-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {replySubmitting ? '发送中...' : '回复'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {comment.replies.length > 0 && (
        <div className="ml-6 space-y-3 border-l-2 border-academia-border/30 pl-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              replyingTo={replyingTo}
              replyText={replyText}
              replySubmitting={replySubmitting}
              onReplyClick={onReplyClick}
              onReplyChange={onReplyChange}
              onReplySubmit={onReplySubmit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
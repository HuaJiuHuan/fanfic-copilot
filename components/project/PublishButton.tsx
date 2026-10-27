'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { publishProject, unpublishProject } from '@/app/actions/publish';
import { useRouter } from 'next/navigation';
import type { TagsData } from '@/lib/types';

interface PublishButtonProps {
  projectId: string;
  isPublished: boolean;
  storyUrl: string;
  outlineTitle?: string;
  outlineVersion?: number | null;
}

const PRESET_TAGS: string[] = [
  '魔道祖师',
  '天官赐福',
  '人渣反派自救系统',
  '原神',
  '崩坏：星穹铁道',
  '咒术回战',
  '排球少年',
  '全职高手',
  '盗墓笔记',
  '鬼灭之刃',
  '文豪野犬',
  '名侦探柯南',
  '进击的巨人',
  'MyGo',
  'BL',
  'GL',
  'BG',
  '无差',
  '粮食',
  '全年龄',
  'PG',
  'R',
  'NC-17',
  'HE',
  'BE',
  '开放式结局',
  'ABO',
  '哨向',
  '日常甜饼',
  '虐文',
  '悬疑',
  '搞笑',
  '正剧',
  '原著向',
  '架空',
  '校园',
  '娱乐圈',
  '修仙',
  '重生',
  '穿越',
  '系统',
  '快穿',
  '破镜重圆',
  '先婚后爱',
  '追妻火葬场',
  '双向暗恋',
  '病娇',
  '年下',
  '西方奇幻',
  '其他',
];

const EMPTY_TAGS: TagsData = {
  preset: [],
  free: [],
};

function PublishDialog({
  open,
  onClose,
  onConfirm,
  loading,
  outlineTitle,
  outlineVersion,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (summary: string, tags: TagsData) => void;
  loading: boolean;
  outlineTitle?: string;
  outlineVersion?: number | null;
}) {
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState<TagsData>(EMPTY_TAGS);
  const [freeInput, setFreeInput] = useState('');

  const presetCount = tags.preset.length;
  const freeCount = tags.free.length;

  const addFreeTag = () => {
    const trimmed = freeInput.trim();
    if (!trimmed || trimmed.length > 20) return;
    if (freeCount >= 2) return;
    if (tags.free.some((t) => t === trimmed)) return;
    setTags((prev) => ({ ...prev, free: [...prev.free, trimmed] }));
    setFreeInput('');
  };

  const removeFreeTag = (idx: number) => {
    setTags((prev) => ({ ...prev, free: prev.free.filter((_, i) => i !== idx) }));
  };

  if (!open) return null;

  const canSubmit = tags.preset.length >= 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onConfirm(summary, tags);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />
      <div className="relative bg-academia-surface border border-academia-border rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-academia-gold/60 to-transparent" />

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <h3 className="text-lg font-serif font-bold text-academia-gold">发布作品</h3>
          {outlineTitle && (
            <div className="bg-academia-bg border border-academia-border/50 rounded-lg p-3 space-y-1">
              <p className="text-[10px] text-academia-muted uppercase tracking-wider">将发布以下大纲的内容</p>
              <p className="text-sm font-serif text-academia-parchment">{outlineTitle}</p>
              {outlineVersion != null && (
                <p className="text-[10px] text-academia-muted/60">大纲版本 #{outlineVersion}</p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-academia-muted font-medium">标签</span>
              <span className={`text-[10px] ${presetCount > 10 || freeCount > 2 ? 'text-red-400' : 'text-academia-muted/60'}`}>
                预设 {presetCount}/10，自由 {freeCount}/2
              </span>
            </div>
            <div className="bg-academia-bg border border-academia-border/50 rounded-lg p-3 space-y-1.5">
              <span className="text-[10px] text-academia-muted">
                固定标签
                <span className="text-academia-gold ml-0.5">*</span>
                <span className="text-academia-muted/50 ml-1">
                  {presetCount}/10
                </span>
              </span>
              <div className="max-h-36 overflow-y-auto flex flex-wrap gap-1.5">
                {[...PRESET_TAGS]
                  .sort((a, b) => {
                    const aSel = tags.preset.includes(a) ? 0 : 1;
                    const bSel = tags.preset.includes(b) ? 0 : 1;
                    return aSel - bSel;
                  })
                  .map((tag) => {
                    const selected = tags.preset.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            setTags((prev) => ({
                              ...prev,
                              preset: prev.preset.filter((t) => t !== tag),
                            }));
                          } else if (presetCount < 10) {
                            setTags((prev) => ({
                              ...prev,
                              preset: [...prev.preset, tag],
                            }));
                          }
                        }}
                        disabled={!selected && presetCount >= 10}
                        className={`inline-block px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
                          selected
                            ? 'bg-academia-gold/10 text-academia-gold border-academia-gold/20'
                            : 'bg-academia-surface text-academia-muted border-academia-border hover:border-academia-gold/30 hover:text-academia-parchment disabled:opacity-30 disabled:cursor-not-allowed'
                        }`}
                      >
                        {selected && '✓ '}
                        {tag}
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="bg-academia-bg border border-academia-border/50 rounded-lg p-3 space-y-1.5">
              <span className="text-[10px] text-academia-muted">自定义标签</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.free.map((t, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-academia-surface text-academia-muted rounded-full border border-academia-border"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeFreeTag(i)}
                      className="text-academia-muted/60 hover:text-academia-parchment ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {freeCount < 2 && (
                  <input
                    value={freeInput}
                    onChange={(e) => setFreeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFreeTag();
                      }
                    }}
                    placeholder={freeCount === 0 ? '输入自定义标签，回车添加（每标签最长20字）' : ''}
                    maxLength={20}
                    className="flex-1 min-w-[120px] bg-transparent text-xs text-academia-parchment placeholder:text-academia-muted/50 focus:outline-none"
                  />
                )}
              </div>
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs text-academia-muted">作品简介</span>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="用几句话介绍你的作品吧..."
              rows={3}
              maxLength={500}
              className="w-full bg-academia-bg border border-academia-border rounded-lg p-3 text-sm text-academia-parchment placeholder:text-academia-muted/50 focus:outline-none focus:border-academia-gold/50 transition-colors resize-none"
            />
            <span className="block text-right text-[10px] text-academia-muted/60">
              {summary.length}/500
            </span>
          </label>

          {!canSubmit && (
            <p className="text-[10px] text-red-400">请至少选择一个固定标签</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs text-academia-muted hover:text-academia-parchment transition-colors border border-academia-border rounded-lg hover:bg-academia-surface disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="bg-academia-gold text-academia-bg px-5 py-2 rounded-lg text-sm font-bold tracking-wide hover:opacity-90 transition-all shadow-[0_0_15px_rgba(232,125,155,0.15)] disabled:opacity-50"
            >
              {loading ? '发布中...' : '确认发布'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

export default function PublishButton({ projectId, isPublished, storyUrl, outlineTitle, outlineVersion }: PublishButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(isPublished);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handlePublish = async (summary: string, tags: TagsData) => {
    setLoading(true);
    try {
      await publishProject(projectId, summary || '', tags);
      setPublished(true);
      setDialogOpen(false);
      router.refresh();
    } catch (e: any) {
      alert(e?.message || '发布失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async () => {
    if (!window.confirm('确定要下架该作品吗？读者将无法继续访问。')) return;

    setLoading(true);
    try {
      await unpublishProject(projectId);
      setPublished(false);
      router.refresh();
    } catch (e: any) {
      alert(e?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  if (published) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={storyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-academia-gold hover:text-academia-parchment px-3 py-2 transition-colors border border-academia-gold/30 rounded-lg hover:border-academia-gold/60"
        >
          📖 查看发布页
        </a>
        <button
          onClick={handleUnpublish}
          disabled={loading}
          className="text-xs text-academia-muted hover:text-red-400 px-3 py-2 transition-colors border border-academia-border rounded-lg hover:border-red-400/50"
        >
          {loading ? '处理中...' : '下架'}
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        disabled={loading}
        className="bg-academia-gold text-academia-bg px-4 py-2 rounded-lg text-sm font-bold tracking-wide hover:opacity-90 transition-all shadow-[0_0_15px_rgba(232,125,155,0.15)] disabled:opacity-50"
      >
        {loading ? '发布中...' : '发布作品'}
      </button>

      <PublishDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handlePublish}
        loading={loading}
        outlineTitle={outlineTitle}
        outlineVersion={outlineVersion}
      />
    </>
  );
}
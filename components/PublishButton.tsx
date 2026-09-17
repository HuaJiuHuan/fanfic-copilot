'use client';

import { useState, useRef, useEffect } from 'react';
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

const PRESET_OPTIONS = {
  fandom: [
    '魔道祖师',
    '天官赐福',
    '人渣反派自救系统',
    '原神',
    '崩坏：星穹铁道',
    '咒术回战',
    '排球少年',
    '全职高手',
    '盗墓笔记',
    'MyGo',
    '其他',
  ],
  category: ['BL', 'GL', 'BG', '无差', '粮食'],
  rating: ['全年龄', 'PG', 'R', 'NC-17'],
  genre: [
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
  ],
} as const;

const EMPTY_TAGS: TagsData = {
  preset: { fandom: [], relationship: [], category: '', rating: '', genre: [] },
  free: [],
};

function countPreset(preset: TagsData['preset']): number {
  return (
    preset.fandom.length +
    preset.relationship.length +
    (preset.category ? 1 : 0) +
    (preset.rating ? 1 : 0) +
    preset.genre.length
  );
}

function MultiSelect({
  label,
  options,
  selected,
  onChange,
  max,
  required,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (v: string[]) => void;
  max: number;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      if (selected.length >= max) return;
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="space-y-1" ref={ref}>
      <span className="text-[10px] text-academia-muted">
        {label}
        {required && <span className="text-academia-gold ml-0.5">*</span>}
        <span className="text-academia-muted/50 ml-1">
          {selected.length}/{max}
        </span>
      </span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full bg-academia-bg border border-academia-border rounded-lg px-3 py-1.5 text-xs text-academia-parchment text-left hover:border-academia-gold/40 transition-colors flex items-center justify-between"
        >
          <span className={selected.length === 0 ? 'text-academia-muted/50' : ''}>
            {selected.length === 0 ? '请选择' : selected.join(' / ')}
          </span>
          <span className="text-academia-muted/60 text-[10px]">▼</span>
        </button>
        {open && (
          <div className="absolute z-50 mt-1 w-full bg-academia-surface border border-academia-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                  selected.includes(opt)
                    ? 'bg-academia-gold/10 text-academia-gold'
                    : 'text-academia-parchment hover:bg-academia-bg'
                }`}
              >
                {selected.includes(opt) && '✓ '}
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PillInput({
  label,
  pills,
  onChange,
  max,
  placeholder,
}: {
  label: string;
  pills: string[];
  onChange: (v: string[]) => void;
  max: number;
  placeholder: string;
}) {
  const [text, setText] = useState('');

  const addPill = () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 20) return;
    if (pills.length >= max) return;
    if (pills.some((p) => p === trimmed)) return;
    onChange([...pills, trimmed]);
    setText('');
  };

  const removePill = (idx: number) => {
    onChange(pills.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-1.5">
      <span className="text-[10px] text-academia-muted">
        {label}
        <span className="text-academia-muted/50 ml-1">
          {pills.length}/{max}
        </span>
      </span>
      <div className="flex flex-wrap items-center gap-1.5 bg-academia-bg border border-academia-border rounded-lg px-2 py-1.5 min-h-[32px]">
        {pills.map((p, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-academia-gold/10 text-academia-gold rounded-full border border-academia-gold/20"
          >
            {p}
            <button
              type="button"
              onClick={() => removePill(i)}
              className="text-academia-gold/60 hover:text-academia-gold ml-0.5"
            >
              ×
            </button>
          </span>
        ))}
        {pills.length < max && (
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addPill();
              }
            }}
            placeholder={pills.length === 0 ? placeholder : ''}
            maxLength={20}
            className="flex-1 min-w-[80px] bg-transparent text-xs text-academia-parchment placeholder:text-academia-muted/50 focus:outline-none"
          />
        )}
      </div>
    </div>
  );
}

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

  const presetCount = countPreset(tags.preset);
  const freeCount = tags.free.length;

  const addFreeTag = () => {
    const trimmed = freeInput.trim();
    if (!trimmed || trimmed.length > 20) return;
    if (freeCount >= 3) return;
    if (tags.free.some((t) => t === trimmed)) return;
    setTags((prev) => ({ ...prev, free: [...prev.free, trimmed] }));
    setFreeInput('');
  };

  const removeFreeTag = (idx: number) => {
    setTags((prev) => ({ ...prev, free: prev.free.filter((_, i) => i !== idx) }));
  };

  if (!open) return null;

  const canSubmit = tags.preset.fandom.length >= 1;

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
              <span className={`text-[10px] ${presetCount > 6 || freeCount > 3 ? 'text-red-400' : 'text-academia-muted/60'}`}>
                预设 {presetCount}/6，自由 {freeCount}/3
              </span>
            </div>
            <div className="bg-academia-bg border border-academia-border/50 rounded-lg p-4 space-y-4">
              <MultiSelect
                label="原著"
                options={PRESET_OPTIONS.fandom}
                selected={tags.preset.fandom}
                onChange={(v) =>
                  setTags((prev) => ({
                    ...prev,
                    preset: { ...prev.preset, fandom: v },
                  }))
                }
                max={2}
                required
              />

              <PillInput
                label="CP / 关系"
                pills={tags.preset.relationship}
                onChange={(v) =>
                  setTags((prev) => ({
                    ...prev,
                    preset: { ...prev.preset, relationship: v },
                  }))
                }
                max={2}
                placeholder="输入CP名，回车添加"
              />

              <div className="grid grid-cols-2 gap-3">
                <MultiSelect
                  label="性向"
                  options={PRESET_OPTIONS.category}
                  selected={tags.preset.category ? [tags.preset.category] : []}
                  onChange={(v) =>
                    setTags((prev) => ({
                      ...prev,
                      preset: { ...prev.preset, category: v[0] || '' },
                    }))
                  }
                  max={1}
                />

                <MultiSelect
                  label="分级"
                  options={PRESET_OPTIONS.rating}
                  selected={tags.preset.rating ? [tags.preset.rating] : []}
                  onChange={(v) =>
                    setTags((prev) => ({
                      ...prev,
                      preset: { ...prev.preset, rating: v[0] || '' },
                    }))
                  }
                  max={1}
                />
              </div>

              <MultiSelect
                label="题材 / 风格"
                options={PRESET_OPTIONS.genre}
                selected={tags.preset.genre}
                onChange={(v) =>
                  setTags((prev) => ({
                    ...prev,
                    preset: { ...prev.preset, genre: v },
                  }))
                }
                max={2}
              />
            </div>

            <div className="bg-academia-bg border border-academia-border/50 rounded-lg p-3 space-y-1.5">
              <span className="text-[10px] text-academia-muted">自由标签</span>
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
                {freeCount < 3 && (
                  <input
                    value={freeInput}
                    onChange={(e) => setFreeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFreeTag();
                      }
                    }}
                    placeholder={freeCount === 0 ? '输入自由标签，回车添加（每标签最长20字）' : ''}
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
            <p className="text-[10px] text-red-400">请至少选择一个原著标签</p>
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
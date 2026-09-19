'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { TagsData, Project } from '@/lib/types';
import { parseTags } from '@/lib/tag-utils';

function TagBadges({ tags }: { tags: TagsData }) {
  return (
    <>
      {tags.preset.map((t, i) => (
        <span
          key={`p-${i}`}
          className="inline-block px-2 py-0.5 text-[10px] bg-academia-gold/10 text-academia-gold rounded-full border border-academia-gold/20"
        >
          {t}
        </span>
      ))}
      {tags.free.map((t, i) => (
        <span
          key={`f-${i}`}
          className="inline-block px-2 py-0.5 text-[10px] bg-academia-surface text-academia-muted rounded-full border border-academia-border"
        >
          {t}
        </span>
      ))}
    </>
  );
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

interface FilterState {
  tags: string[];
}

export interface TagStats {
  tags: Record<string, number>;
}

const EMPTY_FILTERS: FilterState = {
  tags: [],
};

function hasAnyFilter(f: FilterState): boolean {
  return f.tags.length > 0;
}

function matchesFilters(proj: Project, filters: FilterState): boolean {
  const tags = parseTags(proj.tags);
  if (!tags) return !hasAnyFilter(filters);

  if (filters.tags.length > 0 && !tags.preset.some((t) => filters.tags.includes(t))) return false;
  return true;
}

function FilterSection({
  title,
  icon,
  options,
  selected,
  onToggle,
  multi,
}: {
  title: string;
  icon: string;
  options: [string, number][];
  selected: string[];
  onToggle: (val: string) => void;
  multi: boolean;
}) {
  if (options.length === 0) return null;

  return (
    <div className="space-y-1">
      <h4 className="text-[10px] font-bold text-academia-muted uppercase tracking-wider">
        {icon} {title}
      </h4>
      <div className="space-y-0.5">
        {options.map(([val, count]) => {
          const active = selected.includes(val);
          return (
            <button
              key={val}
              type="button"
              onClick={() => onToggle(val)}
              className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center justify-between ${
                active
                  ? 'bg-academia-gold/10 text-academia-gold'
                  : 'text-academia-muted hover:text-academia-parchment hover:bg-academia-bg/50'
              }`}
            >
              <span className="truncate mr-1">
                {active && (multi ? '✓ ' : '● ')}
                {val}
              </span>
              <span className="text-[10px] text-academia-muted/50 shrink-0">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  projects: Project[];
  authorMap: Record<string, string>;
  userId: string;
  tagStats: TagStats;
  interactionMap: Record<string, { kudos: number; bookmarks: number; comments: number }>;
}

export default function DiscoverClient({ projects, authorMap, userId, tagStats, interactionMap }: Props) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const filtered = useMemo(() => {
    if (!hasAnyFilter(filters)) return projects;
    return projects.filter((p) => matchesFilters(p, filters));
  }, [projects, filters]);

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const tagOptions = useMemo(
    () => Object.entries(tagStats.tags).sort(([, a], [, b]) => b - a),
    [tagStats.tags],
  );

  return (
    <div className="flex gap-6">
      <aside className="w-48 shrink-0 space-y-4">
        <div className="bg-academia-surface border border-academia-border rounded-xl p-3 space-y-4 sticky top-6">
          <FilterSection
            title="筛选标签"
            icon="🏷️"
            options={tagOptions}
            selected={filters.tags}
            onToggle={(val) =>
              setFilters((prev) => ({
                tags: prev.tags.includes(val)
                  ? prev.tags.filter((t) => t !== val)
                  : [...prev.tags, val],
              }))
            }
            multi
          />

          {hasAnyFilter(filters) && (
            <button
              type="button"
              onClick={clearFilters}
              className="w-full text-[10px] text-academia-muted hover:text-academia-parchment border border-academia-border rounded-lg py-1.5 transition-colors hover:bg-academia-bg"
            >
              清除全部筛选
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {filtered.length === 0 ? (
          <div className="w-full py-20 flex flex-col items-center justify-center border border-dashed border-academia-border rounded-xl text-academia-muted">
            <span className="text-4xl mb-4 opacity-50">
              {hasAnyFilter(filters) ? '🔍' : '📚'}
            </span>
            <p className="text-sm">
              {hasAnyFilter(filters) ? '没有匹配的作品，试试调整筛选条件。' : '还没有发布的作品，敬请期待。'}
            </p>
            {hasAnyFilter(filters) && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 text-xs text-academia-gold hover:text-academia-parchment underline underline-offset-2"
              >
                清除筛选
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-[10px] text-academia-muted/60 mb-4">
              {hasAnyFilter(filters) ? `筛选结果：${filtered.length} 部作品` : `共 ${filtered.length} 部作品`}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((proj) => (
                <Link
                  key={proj.id}
                  href={`/story/${proj.id}`}
                  className="relative group bg-gradient-to-br from-academia-surface to-academia-bg border border-academia-border rounded-xl hover:border-academia-gold/50 hover:-translate-y-[2px] transition-all duration-300 shadow-sm hover:shadow-[0_8px_25px_rgba(232,125,155,0.1)] overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-academia-gold/60 to-transparent" />

                  <div className="p-4">
                    <h3 className="text-sm font-serif font-bold text-academia-gold mb-2 group-hover:text-academia-parchment transition-colors flex items-center gap-1.5">
                      <span className="shrink-0">📖</span>
                      <span className="line-clamp-1">{proj.title}</span>
                    </h3>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {(() => {
                        const parsed = parseTags(proj.tags);
                        if (parsed) {
                          return <TagBadges tags={parsed} />;
                        }
                        return (
                          <span className="inline-block px-2 py-0.5 text-[10px] bg-academia-gold/10 text-academia-gold rounded-full border border-academia-gold/20">
                            {proj.fandom}
                          </span>
                        );
                      })()}
                      {proj.userId === userId && (
                        <span className="inline-block px-2 py-0.5 text-[10px] bg-academia-surface text-academia-muted rounded-full border border-academia-border">
                          我的
                        </span>
                      )}
                    </div>

                    {proj.summary && (
                      <p className="text-[11px] text-academia-muted mb-2 line-clamp-2 leading-relaxed">
                        {proj.summary}
                      </p>
                    )}

                    {(() => {
                      const stats = interactionMap[proj.id];
                      if (!stats) return null;
                      return (
                        <div className="flex items-center gap-3 text-[10px] text-academia-muted/50 mb-2">
                          <span className="flex items-center gap-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            {stats.kudos}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                            {stats.bookmarks}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            {stats.comments}
                          </span>
                        </div>
                      );
                    })()}

                    <div className="flex items-center justify-between pt-2 border-t border-academia-border/50">
                      <span className="text-[10px] text-academia-muted">
                        {authorMap[proj.userId] || '未知作者'}
                      </span>
                      <span className="text-[10px] text-academia-muted/60">
                        {getRelativeTime(proj.publishedAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
'use client';

import { memo, useEffect, useMemo } from 'react';
import type { Project, OutlineRecord, SceneDraft, TagsData, InteractionState } from '@/lib/types';
import { recordRead } from '@/app/actions/interaction';
import InteractionBar from '@/components/InteractionBar';
import SubscribeButton from '@/components/SubscribeButton';
import ReadingProgress from '@/components/ReadingProgress';
import CommentSection from '@/components/CommentSection';

function parseTags(raw: string | null): TagsData | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TagsData;
  } catch {
    return null;
  }
}

interface Props {
  project: Project;
  outline: OutlineRecord | null;
  drafts: SceneDraft[];
  authorName: string;
  authorId: string;
  interactionState: InteractionState;
}

function countWords(text: string): number {
  if (!text) return 0;
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
}

export default memo(function StoryReader({ project, outline, drafts, authorName, authorId, interactionState }: Props) {
  const storyOutline = outline?.content ?? null;

  useEffect(() => {
    recordRead(project.id);
  }, [project.id]);

  const tagsData = useMemo(() => parseTags(project.tags), [project.tags]);

  const draftsMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const d of drafts) {
      map[d.sceneId] = d.content;
    }
    return map;
  }, [drafts]);

  const stats = useMemo(() => {
    if (!storyOutline) return null;
    const totalScenes = storyOutline.acts.reduce((sum, act) => sum + act.scenes.length, 0);
    const writtenScenes = storyOutline.acts.reduce(
      (sum, act) => sum + act.scenes.filter((s) => draftsMap[s.id]?.trim()).length,
      0,
    );
    const totalWords = Object.values(draftsMap).reduce((sum, text) => sum + countWords(text), 0);
    const actStats = storyOutline.acts.map((act) => ({
      actTitle: act.actTitle,
      wordCount: act.scenes.reduce((sum, s) => sum + countWords(draftsMap[s.id] || ''), 0),
      sceneCount: act.scenes.length,
      writtenCount: act.scenes.filter((s) => draftsMap[s.id]?.trim()).length,
    }));
    return { totalScenes, writtenScenes, totalWords, actStats };
  }, [storyOutline, draftsMap]);

  if (!storyOutline) {
    return (
      <div className="w-full py-20 text-center text-academia-muted">
        <p className="text-lg">暂无内容</p>
        <p className="text-xs mt-2">作者尚未添加章节</p>
      </div>
    );
  }

  return (
    <article className="space-y-12 py-8">
      <ReadingProgress />
      <header className="text-center space-y-4 pb-8 border-b border-academia-border/50">
        <h1 className="text-3xl font-serif font-bold text-academia-gold">
          {storyOutline.title}
        </h1>
        {storyOutline.logline && (
          <p className="text-sm text-academia-muted italic leading-relaxed">
            {storyOutline.logline}
          </p>
        )}
        <div className="flex items-center justify-center gap-4 text-xs text-academia-muted">
          <span>作者：{authorName}</span>
          {stats && (
            <>
              <span className="text-academia-border">|</span>
              <span>
                {stats.writtenScenes}/{stats.totalScenes} 场景
              </span>
              <span className="text-academia-border">|</span>
              <span>{stats.totalWords.toLocaleString()} 字</span>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
          {tagsData ? (
            <>
              {[
                ...tagsData.preset.fandom,
                ...tagsData.preset.relationship,
                ...(tagsData.preset.category ? [tagsData.preset.category] : []),
                ...(tagsData.preset.rating ? [tagsData.preset.rating] : []),
                ...tagsData.preset.genre,
              ].map((t, i) => (
                <span
                  key={`p-${i}`}
                  className="inline-block px-2 py-0.5 text-[10px] bg-academia-gold/10 text-academia-gold rounded-full border border-academia-gold/20"
                >
                  {t}
                </span>
              ))}
              {tagsData.free.map((t, i) => (
                <span
                  key={`f-${i}`}
                  className="inline-block px-2 py-0.5 text-[10px] bg-academia-surface text-academia-muted rounded-full border border-academia-border"
                >
                  {t}
                </span>
              ))}
            </>
          ) : (
            <span className="inline-block px-2 py-0.5 text-[10px] bg-academia-gold/10 text-academia-gold rounded-full border border-academia-gold/20">
              {project.fandom}
            </span>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 mt-4">
          <InteractionBar projectId={project.id} initialState={interactionState} />
          <SubscribeButton
            authorId={authorId}
            authorName={authorName}
            projectId={project.id}
            projectTitle={project.title}
          />
        </div>
      </header>

      {storyOutline.acts.map((act, actIdx) => {
        const actDrafts = act.scenes.map((scene) => draftsMap[scene.id]).filter(Boolean);

        if (actDrafts.length === 0) return null;

        const actStat = stats?.actStats[actIdx];

        return (
          <section key={actIdx} className="space-y-8">
            <div className="text-center">
              <h2 className="text-xl font-serif text-academia-gold font-bold">
                第{actIdx + 1}幕：{act.actTitle}
              </h2>
              {actStat && (
                <p className="text-xs text-academia-muted mt-1">
                  {actStat.writtenCount}/{actStat.sceneCount} 场景 ·{' '}
                  {actStat.wordCount.toLocaleString()} 字
                </p>
              )}
            </div>

            {act.scenes.map((scene) => {
              const draft = draftsMap[scene.id];
              if (!draft) return null;

              const sceneWordCount = countWords(draft);

              return (
                <div key={scene.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-academia-muted uppercase tracking-widest">
                      场景 {scene.sceneNumber} · {scene.location}
                    </span>
                    <span className="text-[10px] text-academia-border">
                      {sceneWordCount.toLocaleString()} 字
                    </span>
                    <span className="flex-1 h-px bg-academia-border/30" />
                  </div>
                  <div className="text-sm text-academia-parchment leading-loose whitespace-pre-wrap font-serif">
                    {draft}
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}

      {Object.keys(draftsMap).length === 0 && (
        <div className="text-center py-20 text-academia-muted">
          <p className="text-lg">暂无正文</p>
          <p className="text-xs mt-2">作者还在努力创作中</p>
        </div>
      )}

      <div className="border-t border-academia-border/50 pt-8 mt-8">
        <CommentSection projectId={project.id} />
      </div>
    </article>
  );
});
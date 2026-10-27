'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { extractStoryInfoAction } from '@/app/actions/import-story';
import { fullImportAction } from '@/app/actions/full-import';
import Link from 'next/link';
import type { StoryExtraction } from '@/lib/validators/story-extraction';
import type { CharacterProfile } from '@/lib/types';

export default function ImportStoryPage() {
  const router = useRouter();
  const [storyText, setStoryText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extraction, setExtraction] = useState<StoryExtraction | null>(null);
  const [extractionError, setExtractionError] = useState('');

  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importStep, setImportStep] = useState('');

  const [characterProfiles, setCharacterProfiles] = useState<CharacterProfile[]>([]);

  const handleExtract = async () => {
    if (!storyText.trim()) return;
    setIsExtracting(true);
    setExtractionError('');
    try {
      const res = await extractStoryInfoAction(storyText);
      if (res.success && res.data) {
        setExtraction(res.data);
        const profiles = (res.data.characterProfiles || []).map((c) => ({
          name: c.name || '',
          voice: c.voice || '',
          bio: c.bio || '',
          relationships: c.relationships || '',
          coreMotivation: '',
        }));
        setCharacterProfiles(profiles);
      } else {
        setExtractionError(res.error || '解析失败，请重试。');
      }
    } catch {
      setExtractionError('网络异常，请重试。');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFullImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const fandom = formData.get('fandom') as string;
    const characters = formData.get('characters') as string;
    const premise = formData.get('premise') as string;

    setIsImporting(true);
    setImportError('');
    setImportStep('正在创建项目...');

    try {
      const res = await fullImportAction(title, fandom, characters, premise, storyText, characterProfiles);
      if (res.success && res.projectId) {
        setImportStep('导入成功，正在跳转...');
        router.push(`/project/${res.projectId}`);
      } else {
        setImportError(res.error || '导入失败，请重试。');
        setIsImporting(false);
      }
    } catch {
      setImportError('网络异常，请重试。');
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-academia-bg text-academia-parchment font-sans flex flex-col items-center justify-center p-6 selection:bg-academia-gold/20">
      <div className="w-full max-w-2xl bg-academia-surface/50 border border-academia-border rounded-2xl p-8 space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-academia-gold/50 to-transparent"></div>

        <div className="space-y-4 border-b border-academia-border pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-academia-gold">灵感导入</h1>
            <p className="text-xs text-academia-muted mt-1">
              粘贴一篇短篇小说，AI 将自动提取信息、生成大纲并把原文拆分到对应场景。
            </p>
          </div>
          <Link
            href="/"
            className="text-xs text-academia-muted hover:text-academia-parchment transition-colors border border-academia-border px-3 py-1.5 rounded-md hover:bg-academia-surface"
            aria-label="返回项目列表"
          >
            ← 返回大厅
          </Link>
        </div>

        {isImporting ? (
          <div className="w-full py-20 flex flex-col items-center justify-center space-y-6 animate-fade-in-up">
            <div className="w-12 h-12 border-2 border-academia-gold border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center space-y-2">
              <p className="text-sm text-academia-gold font-serif">{importStep}</p>
              <p className="text-xs text-academia-muted">
                AI 正在依次完成：项目创建 → 大纲生成 → 原文拆分
              </p>
            </div>
          </div>
        ) : !extraction ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="story-text"
                className="text-xs font-bold text-academia-muted uppercase tracking-widest"
              >
                粘贴短篇小说正文
              </label>
              <textarea
                id="story-text"
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                placeholder="在此粘贴你要导入的短篇小说全文...&#10;&#10;AI 将自动完成：&#10;1. 提取标题、原著、角色、脑洞&#10;2. 反向推导出 3-4 幕结构化大纲&#10;3. 将原文精确拆分到每个场景下"
                rows={14}
                className="w-full bg-academia-bg border border-academia-border rounded-lg p-4 text-sm text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors leading-relaxed resize-none custom-scrollbar"
                aria-required="true"
              />
            </div>

            {extractionError && (
              <div className="p-3 bg-academia-crimson/10 border border-academia-crimson/30 rounded-lg text-xs text-academia-crimson">
                {extractionError}
              </div>
            )}

            <button
              onClick={handleExtract}
              disabled={isExtracting || storyText.trim().length < 50}
              className={`w-full py-3 rounded-lg text-sm font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(232,125,155,0.15)] ${
                isExtracting || storyText.trim().length < 50
                  ? 'bg-academia-surface text-academia-muted cursor-not-allowed border border-academia-border'
                  : 'bg-academia-gold text-academia-bg hover:opacity-90 active:scale-[0.98]'
              }`}
              aria-label="AI 智能解析小说信息"
            >
              {isExtracting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-academia-bg border-t-transparent rounded-full animate-spin"></span>
                  正在解析中...
                </span>
              ) : (
                '✨ AI 智能解析'
              )}
            </button>

            {storyText.trim().length > 0 && storyText.trim().length < 50 && (
              <p className="text-xs text-academia-muted text-center">
                至少输入 50 字才能开始解析（当前 {storyText.trim().length} 字）
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in-up">
            <div className="bg-academia-surface border border-academia-gold/30 rounded-xl p-4 flex items-center gap-3">
              <span className="text-academia-gold text-lg">✨</span>
              <div>
                <p className="text-xs text-academia-gold font-bold">AI 解析完成</p>
                <p className="text-xs text-academia-muted">
                  确认创建后，AI 将自动生成大纲并拆分原文到对应场景。
                </p>
              </div>
            </div>

            {importError && (
              <div className="p-3 bg-academia-crimson/10 border border-academia-crimson/30 rounded-lg text-xs text-academia-crimson">
                {importError}
              </div>
            )}

            <form onSubmit={handleFullImport} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="title"
                  className="text-xs font-bold text-academia-muted uppercase tracking-widest"
                >
                  代号 (Project Title)
                </label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  defaultValue={extraction.title}
                  required
                  className="w-full bg-academia-bg border border-academia-border rounded-lg p-3 text-sm text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors"
                  aria-required="true"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="fandom"
                  className="text-xs font-bold text-academia-muted uppercase tracking-widest"
                >
                  原著 (Fandom)
                </label>
                <input
                  id="fandom"
                  type="text"
                  name="fandom"
                  defaultValue={extraction.fandom}
                  required
                  className="w-full bg-academia-bg border border-academia-border rounded-lg p-3 text-sm text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors"
                  aria-required="true"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="characters"
                  className="text-xs font-bold text-academia-muted uppercase tracking-widest"
                >
                  核心角色 (Characters)
                </label>
                <input
                  id="characters"
                  type="text"
                  name="characters"
                  defaultValue={extraction.characters}
                  required
                  className="w-full bg-academia-bg border border-academia-border rounded-lg p-3 text-sm text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors"
                  aria-required="true"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="premise"
                  className="text-xs font-bold text-academia-muted uppercase tracking-widest"
                >
                  核心脑洞 (Premise)
                </label>
                <textarea
                  id="premise"
                  name="premise"
                  defaultValue={extraction.premise}
                  required
                  className="w-full h-24 resize-none bg-academia-bg border border-academia-border rounded-lg p-3 text-sm text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors leading-relaxed"
                  aria-required="true"
                />
              </div>

              {characterProfiles.length > 0 && (
                <div className="space-y-3 border-t border-academia-gold/20 pt-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-academia-gold uppercase tracking-widest">
                      🎭 角色工坊（AI 提取）
                    </h3>
                    <span className="text-[10px] text-academia-muted">
                      {characterProfiles.length} 个角色 · 可在项目中继续编辑
                    </span>
                  </div>
                  {characterProfiles.map((profile, idx) => (
                    <div
                      key={idx}
                      className="bg-academia-bg/50 border border-academia-border/50 rounded-lg p-4 space-y-3"
                    >
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => {
                          setCharacterProfiles((prev) =>
                            prev.map((p, i) =>
                              i === idx ? { ...p, name: e.target.value } : p,
                            ),
                          );
                        }}
                        placeholder="角色名"
                        className="w-full bg-transparent text-sm font-bold text-academia-gold outline-none border-b border-academia-border/30 pb-1 focus:border-academia-gold/50 transition-colors"
                      />
                      <div className="space-y-2">
                        <label className="text-[10px] text-academia-muted uppercase tracking-wider">
                          🗣️ 语气标签
                        </label>
                        <textarea
                          value={profile.voice}
                          onChange={(e) => {
                            setCharacterProfiles((prev) =>
                              prev.map((p, i) =>
                                i === idx ? { ...p, voice: e.target.value } : p,
                              ),
                            );
                          }}
                          placeholder="描述说话风格、口头禅、节奏……"
                          rows={2}
                          className="w-full bg-academia-bg border border-academia-border rounded-md px-2.5 py-1.5 text-xs text-academia-parchment/80 leading-relaxed resize-none outline-none focus:border-academia-gold/40 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-academia-muted uppercase tracking-wider">
                          📝 人设简介
                        </label>
                        <textarea
                          value={profile.bio}
                          onChange={(e) => {
                            setCharacterProfiles((prev) =>
                              prev.map((p, i) =>
                                i === idx ? { ...p, bio: e.target.value } : p,
                              ),
                            );
                          }}
                          placeholder="外貌、性格、背景……"
                          rows={2}
                          className="w-full bg-academia-bg border border-academia-border rounded-md px-2.5 py-1.5 text-xs text-academia-parchment/80 leading-relaxed resize-none outline-none focus:border-academia-gold/40 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-academia-muted uppercase tracking-wider">
                          🔗 角色关系
                        </label>
                        <textarea
                          value={profile.relationships}
                          onChange={(e) => {
                            setCharacterProfiles((prev) =>
                              prev.map((p, i) =>
                                i === idx ? { ...p, relationships: e.target.value } : p,
                              ),
                            );
                          }}
                          placeholder="对其他角色的态度和关系……"
                          rows={2}
                          className="w-full bg-academia-bg border border-academia-border rounded-md px-2.5 py-1.5 text-xs text-academia-parchment/80 leading-relaxed resize-none outline-none focus:border-academia-gold/40 transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setExtraction(null); setCharacterProfiles([]); }}
                  className="flex-1 bg-academia-surface border border-academia-border text-academia-muted py-3 rounded-lg text-sm font-bold hover:text-academia-parchment hover:border-academia-gold/50 transition-all"
                  aria-label="返回重新导入"
                >
                  重新导入
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-academia-gold text-academia-bg py-3 rounded-lg text-sm font-bold tracking-wide hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(232,125,155,0.15)]"
                  aria-label="创建项目并自动生成大纲和拆分正文"
                >
                  确认创建并导入全文
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { createProjectAction } from '@/app/actions/project';
import Link from 'next/link';

interface CharProfileInput {
  name: string;
  voice: string;
  bio: string;
  relationships: string;
  coreMotivation: string;
}

export default function NewProjectPage() {
  const [title, setTitle] = useState('');
  const [fandom, setFandom] = useState('');
  const [characters, setCharacters] = useState('');
  const [premise, setPremise] = useState('');

  const [charProfiles, setCharProfiles] = useState<CharProfileInput[]>([
    { name: '', voice: '', bio: '', relationships: '', coreMotivation: '' },
  ]);

  const addCharProfile = () => {
    setCharProfiles((prev) => [...prev, { name: '', voice: '', bio: '', relationships: '', coreMotivation: '' }]);
  };

  const removeCharProfile = (idx: number) => {
    setCharProfiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateCharProfile = (idx: number, field: keyof CharProfileInput, value: string) => {
    setCharProfiles((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };

  const handleBandoriPreset = () => {
    setTitle('春日影下的休止符');
    setFandom('BanG Dream! (MyGO!!!!!)');
    setCharacters('长崎爽世, 丰川祥子, 高松灯');
    setPremise(
      '在《春日影》的旋律被重新奏响的当晚，爽世在暴雨的天桥下死死拦住了祥子。如果当初 CRYCHIC 没有解散，她们的命运会走向何方？两人在雨中展开了彻底的对峙，撕开了彼此最后伪装的体面。而这一幕，恰好被一路默默尾随的灯尽收眼底。灯决定用自己的方式，强行把她们重新绑回同一个舞台...',
    );
  };

  return (
    <div className="min-h-screen bg-academia-bg text-academia-parchment font-sans flex flex-col items-center justify-center p-6 selection:bg-academia-gold/20">
      <div className="w-full max-w-xl bg-academia-surface/50 border border-academia-border rounded-2xl p-8 space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-academia-gold/50 to-transparent"></div>

        <div className="space-y-4 border-b border-academia-border pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-academia-gold">建立新世界线</h1>
            <p className="text-xs text-academia-muted mt-1" id="page-description">
              锁定基础设定，打造你的专属灵感沙盒。
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

        <div className="bg-academia-surface border border-academia-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-academia-muted">
            <span className="text-academia-gold font-bold mb-1 block">
              ✨ 灵感速写 (Quick Start)
            </span>
            懒得打字？点击右侧一键载入测试数据。
          </div>
          <button
            type="button"
            onClick={handleBandoriPreset}
            className="whitespace-nowrap bg-academia-surface border border-academia-gold/30 text-academia-gold px-4 py-2 rounded-lg text-xs font-bold tracking-wider hover:bg-academia-gold/10 hover:border-academia-gold transition-all"
            aria-label="载入 BanG Dream! 预设数据"
          >
            载入 BanG Dream! 预设
          </button>
        </div>

        <form
          action={createProjectAction}
          className="space-y-5"
          aria-describedby="page-description"
        >
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="如：西伯利亚绝境生存指北"
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
              value={fandom}
              onChange={(e) => setFandom(e.target.value)}
              required
              placeholder="如：漫威电影宇宙"
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
              value={characters}
              onChange={(e) => setCharacters(e.target.value)}
              required
              placeholder="如：托尼·斯塔克, 史蒂夫·罗杰斯"
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
              value={premise}
              onChange={(e) => setPremise(e.target.value)}
              required
              placeholder="一句话描述核心冲突与故事线..."
              className="w-full h-32 resize-none bg-academia-bg border border-academia-border rounded-lg p-3 text-sm text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors leading-relaxed"
              aria-required="true"
            />
          </div>

          <input type="hidden" name="characterProfiles" value={JSON.stringify(charProfiles.filter((c) => c.name.trim()))} />

          <div className="space-y-3 border-t border-academia-border pt-5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-academia-gold uppercase tracking-widest">
                🎭 角色工坊 (可选)
              </label>
              <button
                type="button"
                onClick={addCharProfile}
                className="text-xs text-academia-muted hover:text-academia-parchment border border-academia-border px-2 py-0.5 rounded transition-colors"
              >
                + 添加角色
              </button>
            </div>
            <p className="text-[11px] text-academia-muted/60 -mt-1">
              为每位角色填写语气标签、人设、关系和核心动机，让你的 AI 助手更好地把控角色声线。
            </p>

            {charProfiles.map((cp, idx) => (
              <div key={idx} className="bg-academia-bg/50 border border-academia-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-academia-muted uppercase tracking-wider">
                    角色 #{idx + 1}
                  </span>
                  {charProfiles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCharProfile(idx)}
                      className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
                    >
                      移除
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={cp.name}
                  onChange={(e) => updateCharProfile(idx, 'name', e.target.value)}
                  placeholder="角色名"
                  className="w-full bg-academia-bg border border-academia-border rounded-lg px-3 py-2 text-sm text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors"
                />
                <input
                  type="text"
                  value={cp.voice}
                  onChange={(e) => updateCharProfile(idx, 'voice', e.target.value)}
                  placeholder="语气标签 · 如：慵懒、带刺、句短、尾音下沉"
                  className="w-full bg-academia-bg border border-academia-border rounded-lg px-3 py-2 text-sm text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors"
                />
                <textarea
                  value={cp.bio}
                  onChange={(e) => updateCharProfile(idx, 'bio', e.target.value)}
                  placeholder="人设简介 · 外貌、性格、背景..."
                  className="w-full h-16 resize-none bg-academia-bg border border-academia-border rounded-lg px-3 py-2 text-sm text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors leading-relaxed"
                />
                <textarea
                  value={cp.relationships}
                  onChange={(e) => updateCharProfile(idx, 'relationships', e.target.value)}
                  placeholder="角色关系 · 对A：保护欲… 对B：敌意…"
                  className="w-full h-16 resize-none bg-academia-bg border border-academia-border rounded-lg px-3 py-2 text-sm text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors leading-relaxed"
                />
                <textarea
                  value={cp.coreMotivation}
                  onChange={(e) => updateCharProfile(idx, 'coreMotivation', e.target.value)}
                  placeholder="核心动机 · 该角色在本故事中的驱动力"
                  className="w-full h-16 resize-none bg-academia-bg border border-academia-border rounded-lg px-3 py-2 text-sm text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors leading-relaxed"
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full bg-academia-gold text-academia-bg py-3 rounded-lg text-sm font-bold tracking-wide hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(232,125,155,0.15)] mt-4"
            aria-label="创建项目并进入沙盒"
          >
            开坑并进入沙盒
          </button>
        </form>
      </div>
    </div>
  );
}
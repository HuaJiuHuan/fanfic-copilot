'use client';

import type { CharacterProfile } from '@/lib/types';
import EditableField from './EditableField';

interface CharacterFieldsProps {
  char: CharacterProfile;
  onFieldChange: (field: keyof CharacterProfile, value: string) => void;
}

export default function CharacterFields({ char, onFieldChange }: CharacterFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <span className="text-[10px] text-academia-muted uppercase tracking-wider">
          角色名
        </span>
        <input
          value={char.name}
          onChange={(e) => onFieldChange('name', e.target.value)}
          placeholder="输入角色名"
          className="w-full bg-academia-bg border border-academia-border rounded px-2.5 py-1.5 text-sm font-bold text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors"
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>

      <EditableField
        label="🗣️ 语气标签"
        value={char.voice || ''}
        placeholder="描述角色的说话风格、口头禅、节奏……"
        shortLabel="语气混乱度低、代入及时"
        onChange={(v) => onFieldChange('voice', v)}
      />

      <EditableField
        label="📝 人设简介"
        value={char.bio || ''}
        placeholder="外貌、性格、背景故事、特殊能力……"
        shortLabel="写作时快速回顾角色设定"
        onChange={(v) => onFieldChange('bio', v)}
      />

      <EditableField
        label="🔗 角色关系"
        value={char.relationships || ''}
        placeholder="对角色A：保护欲… 对角色B：敌意…"
        shortLabel="关系混乱度低、互动真实"
        onChange={(v) => onFieldChange('relationships', v)}
      />

      <EditableField
        label="🎯 核心动机"
        value={char.coreMotivation || ''}
        placeholder="该角色在当前故事中的核心驱动力"
        shortLabel="驱动角色行为选择"
        onChange={(v) => onFieldChange('coreMotivation', v)}
      />
    </>
  );
}
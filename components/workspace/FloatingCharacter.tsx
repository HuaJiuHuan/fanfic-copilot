'use client';

import { memo, useState, useCallback, useRef } from 'react';
import { updateProjectAction } from '@/app/actions/project';
import { generateThreeVariantsAction, autoFillCharacterAction, extractDialogueAction, actOppositeAction } from '@/app/actions/corpus';
import type { CharacterProfile, VoiceCorpusSample, CorpusLine } from '@/lib/types';
import CharacterHeader from '@/components/character/CharacterHeader';
import CharacterFields from '@/components/character/CharacterFields';
import SmartFillPanel from '@/components/character/SmartFillPanel';
import ExtractPanel from '@/components/character/ExtractPanel';
import CollectPanel from '@/components/character/CollectPanel';
import CorpusPanel from '@/components/character/CorpusPanel';
import ImprovPanel from '@/components/character/ImprovPanel';
import CharacterBottomBar from '@/components/character/CharacterBottomBar';

interface FloatingCharacterProps {
  characters: CharacterProfile[];
  projectId: string;
  userName?: string;
}

const DRAG_THRESHOLD = 5;
const INITIAL_SIZE = 600;
const MIN_SIZE = 240;
const MAX_SIZE = 1000;
const SAVE_DEBOUNCE = 1500;

export default memo(function FloatingCharacter({
  characters: initialCharacters,
  projectId,
  userName,
}: FloatingCharacterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 280 });
  const [cardSize, setCardSize] = useState(INITIAL_SIZE);
  const [activeIndex, setActiveIndex] = useState(0);

  const [localChars, setLocalChars] = useState<CharacterProfile[]>(() =>
    initialCharacters.map((c) => ({ ...c })),
  );

  const [showCorpusPanel, setShowCorpusPanel] = useState(false);
  const [showImprov, setShowImprov] = useState(false);
  const [improvMessages, setImprovMessages] = useState<Array<{ role: 'user' | 'character'; text: string }>>([]);
  const [improvInput, setImprovInput] = useState('');
  const [improvSending, setImprovSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [collectStep, setCollectStep] = useState<'idle' | 'picking' | 'loading' | 'choosing'>('idle');
  const [collectVariants, setCollectVariants] = useState<Array<{ axis: string; hypothesis: string; lines: CorpusLine[] }> | null>(null);
  const [collectScenario, setCollectScenario] = useState({ key: '', label: '' });
  const [smartFillStep, setSmartFillStep] = useState<'idle' | 'input' | 'loading' | 'review'>('idle');
  const [smartFillDesc, setSmartFillDesc] = useState('');
  const [smartFillFields, setSmartFillFields] = useState<{ name: string; voice: string; bio: string; relationships: string; coreMotivation: string } | null>(null);
  const [extractStep, setExtractStep] = useState<'idle' | 'input' | 'loading' | 'review'>('idle');
  const [extractText, setExtractText] = useState('');
  const [extractLines, setExtractLines] = useState<CorpusLine[] | null>(null);
  const [extractScenario, setExtractScenario] = useState('');

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stripYRef = useRef(280);

  const saveCharacterProfiles = useCallback(
    (chars: CharacterProfile[]) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        updateProjectAction(projectId, { characterProfiles: chars });
      }, SAVE_DEBOUNCE);
    },
    [projectId],
  );

  const handleFieldChange = useCallback(
    (field: keyof CharacterProfile, value: string) => {
      setLocalChars((prev) => {
        const next = prev.map((c, i) =>
          i === activeIndex ? { ...c, [field]: value } : c,
        );
        saveCharacterProfiles(next);
        return next;
      });
    },
    [activeIndex, saveCharacterProfiles],
  );

  const addCharacter = useCallback(() => {
    setLocalChars((prev) => {
      const next = [...prev, { name: '', voice: '', bio: '', relationships: '', coreMotivation: '' }];
      saveCharacterProfiles(next);
      setActiveIndex(next.length - 1);
      return next;
    });
  }, [saveCharacterProfiles]);

  const removeCharacter = useCallback(() => {
    if (localChars.length <= 1) return;
    setConfirmDelete(true);
  }, [localChars.length]);

  const handleConfirmDelete = useCallback(() => {
    setLocalChars((prev) => {
      const next = prev.filter((_, i) => i !== activeIndex);
      saveCharacterProfiles(next);
      setActiveIndex((a) => Math.min(a, next.length - 1));
      return next;
    });
    setConfirmDelete(false);
  }, [activeIndex, saveCharacterProfiles]);

  const handleCancelDelete = useCallback(() => {
    setConfirmDelete(false);
  }, []);

  const deleteSample = useCallback(
    (sampleId: string) => {
      setLocalChars((prev) => {
        const next = prev.map((c, i) => {
          if (i !== activeIndex) return c;
          return {
            ...c,
            voiceCorpus: (c.voiceCorpus || []).filter((s) => s.id !== sampleId),
          };
        });
        saveCharacterProfiles(next);
        return next;
      });
    },
    [activeIndex, saveCharacterProfiles],
  );

  const handleCollectClick = useCallback(() => {
    setCollectStep('picking');
    setCollectVariants(null);
    setCollectScenario({ key: '', label: '' });
  }, []);

  const handleScenarioPick = useCallback(
    async (key: string, label: string) => {
      const char = localChars[activeIndex];
      if (!char) return;
      setCollectScenario({ key, label });
      setCollectStep('loading');
      const result = await generateThreeVariantsAction(char, key, label);
      if (result.success) {
        setCollectVariants(result.variants);
        setCollectStep('choosing');
      } else {
        setCollectStep('picking');
      }
    },
    [activeIndex, localChars],
  );

  const handleVariantSelect = useCallback(
    (variantIndex: number) => {
      if (!collectVariants || !collectScenario.key) return;
      const selected = collectVariants[variantIndex];
      const newSample: VoiceCorpusSample = {
        id: `pref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        scenario: collectScenario.key,
        scenarioLabel: collectScenario.label,
        axis: selected.axis,
        hypothesis: selected.hypothesis,
        lines: selected.lines,
        source: 'preference',
        createdAt: new Date().toISOString(),
      };
      setLocalChars((prev) => {
        const next = prev.map((c, i) => {
          if (i !== activeIndex) return c;
          return {
            ...c,
            voiceCorpus: [...(c.voiceCorpus || []), newSample],
          };
        });
        saveCharacterProfiles(next);
        return next;
      });
      setCollectStep('idle');
      setCollectVariants(null);
    },
    [activeIndex, collectVariants, collectScenario, saveCharacterProfiles],
  );

  const handleCancelCollect = useCallback(() => {
    setCollectStep('idle');
    setCollectVariants(null);
  }, []);

  const handleStartSmartFill = useCallback(() => {
    setSmartFillStep('input');
    setSmartFillDesc('');
    setSmartFillFields(null);
  }, []);

  const handleSubmitSmartFill = useCallback(async () => {
    if (!smartFillDesc.trim()) return;
    setSmartFillStep('loading');
    const result = await autoFillCharacterAction(smartFillDesc);
    if (result.success) {
      setSmartFillFields(result.fields);
      setSmartFillStep('review');
    } else {
      setSmartFillStep('input');
    }
  }, [smartFillDesc]);

  const handleConfirmFill = useCallback(() => {
    if (!smartFillFields) return;
    setLocalChars((prev) => {
      const next = prev.map((c, i) => {
        if (i !== activeIndex) return c;
        return {
          ...c,
          name: smartFillFields.name || c.name,
          voice: smartFillFields.voice || c.voice,
          bio: smartFillFields.bio || c.bio,
          relationships: smartFillFields.relationships || c.relationships,
          coreMotivation: smartFillFields.coreMotivation || c.coreMotivation,
        };
      });
      saveCharacterProfiles(next);
      return next;
    });
    setSmartFillStep('idle');
    setSmartFillFields(null);
  }, [activeIndex, smartFillFields, saveCharacterProfiles]);

  const handleStartExtract = useCallback(() => {
    setExtractStep('input');
    setExtractText('');
    setExtractLines(null);
    setExtractScenario('');
  }, []);

  const handleSubmitExtract = useCallback(async () => {
    const char = localChars[activeIndex];
    if (!char || !extractText.trim() || !char.name) return;
    setExtractStep('loading');
    const result = await extractDialogueAction(extractText, char.name);
    if (result.success) {
      setExtractLines(result.lines);
      setExtractScenario(result.scenario);
      setExtractStep('review');
    } else {
      setExtractStep('input');
    }
  }, [activeIndex, localChars, extractText]);

  const handleConfirmExtract = useCallback(() => {
    if (!extractLines || !extractLines.length) return;
    const newSample: VoiceCorpusSample = {
      id: `ext_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      scenario: extractScenario || '文本提取',
      scenarioLabel: extractScenario || '文本提取',
      lines: extractLines,
      source: 'script_extract',
      createdAt: new Date().toISOString(),
    };
    setLocalChars((prev) => {
      const next = prev.map((c, i) => {
        if (i !== activeIndex) return c;
        return {
          ...c,
          voiceCorpus: [...(c.voiceCorpus || []), newSample],
        };
      });
      saveCharacterProfiles(next);
      return next;
    });
    setExtractStep('idle');
    setExtractLines(null);
  }, [activeIndex, extractLines, extractScenario, saveCharacterProfiles]);

  const handleStartImprov = useCallback(() => {
    setShowImprov(true);
    setImprovMessages([]);
    setImprovInput('');
    setImprovSending(false);
  }, []);

  const handleImprovSend = useCallback(
    async (text: string) => {
      const char = localChars[activeIndex];
      if (!char) return;
      const userMsg = { role: 'user' as const, text };
      setImprovMessages((prev) => [...prev, userMsg]);
      setImprovSending(true);
      const result = await actOppositeAction(char, [...improvMessages, userMsg], text);
      if (result.success) {
        setImprovMessages((prev) => [...prev, { role: 'character', text: result.reply.text }]);
      }
      setImprovSending(false);
    },
    [activeIndex, localChars, improvMessages],
  );

  const handleImprovSave = useCallback(
    (line: CorpusLine) => {
      const char = localChars[activeIndex];
      if (!char) return;
      const newSample: VoiceCorpusSample = {
        id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        scenario: 'chat',
        scenarioLabel: '言灵契定',
        lines: [line],
        source: 'chat',
        createdAt: new Date().toISOString(),
      };
      setLocalChars((prev) => {
        const next = prev.map((c, i) => {
          if (i !== activeIndex) return c;
          return {
            ...c,
            voiceCorpus: [...(c.voiceCorpus || []), newSample],
          };
        });
        saveCharacterProfiles(next);
        return next;
      });
    },
    [activeIndex, localChars, saveCharacterProfiles],
  );

  const handleCancelImprov = useCallback(() => {
    setShowImprov(false);
    setImprovMessages([]);
    setImprovInput('');
    setImprovSending(false);
  }, []);

  const dragRef = useRef({
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0,
    moved: false,
  });

  const resizeRef = useRef({
    startX: 0,
    startY: 0,
    startSize: INITIAL_SIZE,
  });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPosX: position.x,
        startPosY: position.y,
        moved: false,
      };

      const handleMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;

        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
          dragRef.current.moved = true;
        }

        if (isExpanded) {
          const maxX = window.innerWidth - cardSize;
          const maxY = window.innerHeight - cardSize;
          setPosition({
            x: Math.max(0, Math.min(dragRef.current.startPosX + dx, maxX)),
            y: Math.max(0, Math.min(dragRef.current.startPosY + dy, maxY)),
          });
        } else {
          const maxY = window.innerHeight - 160;
          const newY = Math.max(0, Math.min(dragRef.current.startPosY + dy, maxY));
          stripYRef.current = newY;
          setPosition((prev) => ({
            ...prev,
            y: newY,
          }));
        }
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);

        if (!dragRef.current.moved && !isExpanded) {
          stripYRef.current = position.y;
          setPosition({
            x: Math.max(12, window.innerWidth / 2 - cardSize / 2),
            y: Math.max(0, position.y - 50),
          });
          setIsExpanded(true);
        }
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [isExpanded, position, cardSize],
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startSize: cardSize,
      };

      const handleMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - resizeRef.current.startX;
        const dy = ev.clientY - resizeRef.current.startY;
        const delta = Math.max(dx, dy);
        const newSize = Math.max(MIN_SIZE, Math.min(MAX_SIZE, resizeRef.current.startSize + delta));
        setCardSize(newSize);
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [cardSize],
  );

  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
    setPosition({ x: 0, y: Math.max(0, Math.min(stripYRef.current, window.innerHeight - 160)) });
  }, []);

  const navigateChar = useCallback(
    (dir: 'prev' | 'next') => {
      setConfirmDelete(false);
      setShowCorpusPanel(false);
      setShowImprov(false);
      setImprovMessages([]);
      setImprovInput('');
      setImprovSending(false);
      setSmartFillStep('idle');
      setExtractStep('idle');
      setActiveIndex((prev) => {
        if (dir === 'prev') return prev > 0 ? prev - 1 : localChars.length - 1;
        return prev < localChars.length - 1 ? prev + 1 : 0;
      });
    },
    [localChars.length],
  );

  const char = localChars[activeIndex] || null;

  if (!isExpanded) {
    return (
      <div
        className="fixed z-50 left-0 bg-academia-surface border border-academia-border border-l-0 rounded-r-lg px-1.5 py-8 cursor-grab active:cursor-grabbing select-none shadow-lg hover:border-academia-gold/30 transition-colors"
        style={{ top: position.y }}
        onMouseDown={handleMouseDown}
      >
        <span
          className="text-xs text-academia-gold font-bold tracking-[0.3em]"
          style={{ writingMode: 'vertical-rl' }}
        >
          角色工坊
        </span>
      </div>
    );
  }

  return (
    <div
      className="fixed z-50 bg-academia-surface border border-academia-gold/30 rounded-xl shadow-2xl select-none overflow-hidden flex flex-col"
      style={{
        left: position.x,
        top: position.y,
        width: cardSize,
        height: cardSize,
      }}
      onMouseDown={handleMouseDown}
    >
      <CharacterHeader
        activeIndex={activeIndex}
        totalChars={localChars.length}
        hasMultiple={localChars.length > 1}
        onStartSmartFill={handleStartSmartFill}
        onAddCharacter={addCharacter}
        onNavigate={navigateChar}
        onCollapse={handleCollapse}
      />

      {!char && (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-academia-muted text-center leading-relaxed">
            暂无角色数据。
            <br />
            点击顶部 <span className="text-academia-gold">+</span> 创建第一个角色，或返回项目创建页面填写。
          </p>
        </div>
      )}

      {char && smartFillStep !== 'idle' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 select-text">
          <SmartFillPanel
            step={smartFillStep as 'input' | 'loading' | 'review'}
            description={smartFillDesc}
            fields={smartFillFields}
            onDescChange={setSmartFillDesc}
            onSubmit={handleSubmitSmartFill}
            onConfirm={handleConfirmFill}
            onCancel={() => setSmartFillStep('idle')}
            onRetry={() => { setSmartFillStep('input'); setSmartFillFields(null); }}
          />
        </div>
      )}

      {char && extractStep !== 'idle' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 select-text">
          <ExtractPanel
            step={extractStep as 'input' | 'loading' | 'review'}
            charName={char.name || ''}
            text={extractText}
            lines={extractLines}
            scenario={extractScenario}
            onTextChange={setExtractText}
            onSubmit={handleSubmitExtract}
            onConfirm={handleConfirmExtract}
            onCancel={() => setExtractStep('idle')}
            onRetry={() => { setExtractStep('input'); setExtractLines(null); }}
          />
        </div>
      )}

      {char && smartFillStep === 'idle' && extractStep === 'idle' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 select-text">
          <CharacterFields char={char} onFieldChange={handleFieldChange} />
        </div>
      )}

      {char && showCorpusPanel && (
        <CorpusPanel
          char={char}
          onDeleteSample={deleteSample}
          onClose={() => setShowCorpusPanel(false)}
        />
      )}

      {char && showImprov && (
        <ImprovPanel
          charName={char.name || ''}
          userName={userName || '用户'}
          messages={improvMessages}
          input={improvInput}
          isSending={improvSending}
          onInputChange={setImprovInput}
          onSend={handleImprovSend}
          onSaveLine={handleImprovSave}
          onCancel={handleCancelImprov}
        />
      )}

      {char && collectStep !== 'idle' && (
        <CollectPanel
          step={collectStep}
          charName={char.name || ''}
          scenarioLabel={collectScenario.label}
          variants={collectVariants}
          onScenarioPick={handleScenarioPick}
          onVariantSelect={handleVariantSelect}
          onCancel={handleCancelCollect}
        />
      )}

      <CharacterBottomBar
        char={char}
        showCorpusPanel={showCorpusPanel}
        confirmDelete={confirmDelete}
        hasMultiple={localChars.length > 1}
        onToggleCorpus={() => setShowCorpusPanel(!showCorpusPanel)}
        onCollect={handleCollectClick}
        onImprov={handleStartImprov}
        onExtract={handleStartExtract}
        onRemove={removeCharacter}
        onConfirmDelete={handleConfirmDelete}
        onCancelDelete={handleCancelDelete}
      />

      <div
        className="absolute bottom-1 right-1 w-4 h-4 cursor-nwse-resize text-academia-border/40 hover:text-academia-gold/60 transition-colors flex items-center justify-center"
        onMouseDown={handleResizeMouseDown}
        aria-label="拖拽调整卡片大小"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M0 10 L10 0 L10 10 Z" />
        </svg>
      </div>
    </div>
  );
});
import type { StateCreator } from 'zustand';
import { toast } from 'sonner';
import type { GeneratingPhase, PhaseEvent } from '@/lib/generate-phase-machine';
import { getNextPhase } from '@/lib/generate-phase-machine';
import { streamGeneration } from '@/lib/services/generation.service';
import type { WorkspaceSlice, EditorReview } from './workspace.slice';
import { getActiveSceneInfo } from './workspace.slice';

export interface GenerationSlice {
  isGeneratingScene: boolean;
  isTyping: boolean;
  sceneWordCount: number;
  sceneStyle: string;
  sceneCustomNote: string;
  editorReview: EditorReview | null;
  generatingPhase: GeneratingPhase;
  abortControllerRef: { current: AbortController | null };

  setSceneWordCount: (count: number) => void;
  setSceneStyle: (style: string) => void;
  setSceneCustomNote: (note: string) => void;
  generateScene: () => Promise<void>;
  stopTyping: () => void;
  transitionPhase: (event: PhaseEvent) => void;
}

export const createGenerationSlice: StateCreator<
  WorkspaceSlice & GenerationSlice,
  [],
  [],
  GenerationSlice
> = (set, get) => ({
  isGeneratingScene: false,
  isTyping: false,
  sceneWordCount: 1000,
  sceneStyle: '',
  sceneCustomNote: '',
  editorReview: null,
  generatingPhase: 'idle',
  abortControllerRef: { current: null },

  setSceneWordCount: (count) => set({ sceneWordCount: count }),
  setSceneStyle: (style) => set({ sceneStyle: style }),
  setSceneCustomNote: (note) => set({ sceneCustomNote: note }),

  generateScene: async () => {
    const state = get();
    const {
      project,
      activeSceneId,
      history,
      selectedIndex,
      sceneWordCount,
      sceneStyle,
      sceneCustomNote,
    } = state;
    const sceneInfo = getActiveSceneInfo(state);
    const current = history[selectedIndex];
    if (!sceneInfo || !activeSceneId || !current) return;

    const abortController = new AbortController();
    set({
      isGeneratingScene: true,
      editorReview: null,
      abortControllerRef: { current: abortController },
    });
    get().transitionPhase({ type: 'START_SETTING' });

    try {
      set({ isGeneratingScene: false, isTyping: true });

      await streamGeneration(
        {
          projectId: project.id,
          fandom: project.fandom,
          characters: project.characters,
          premise: project.premise,
          sceneInfo: {
            sceneId: activeSceneId,
            sceneNumber: sceneInfo.sceneNumber,
            location: sceneInfo.location,
            plotAction: sceneInfo.plotAction,
            conflict: sceneInfo.conflict,
            emotionalShift: sceneInfo.emotionalShift,
            wordCount: sceneWordCount || undefined,
            style: sceneStyle || undefined,
            customNote: sceneCustomNote || undefined,
          },
        },
        {
          onChunk: (accumulated) => {
            set((s) => ({
              draftsMap: { ...s.draftsMap, [activeSceneId]: accumulated },
              draftPresenceMap: { ...s.draftPresenceMap, [activeSceneId]: true },
            }));
          },
          onPhaseChange: (phase) => {
            switch (phase) {
              case 'setting':
                get().transitionPhase({ type: 'START_SETTING' });
                break;
              case 'writing':
                get().transitionPhase({ type: 'START_WRITING' });
                break;
              case 'editing':
                get().transitionPhase({ type: 'START_EDITING' });
                break;
              case 'complete':
                get().transitionPhase({ type: 'COMPLETE' });
                break;
            }
          },
          onComplete: (finalText, editorReview) => {
            get().transitionPhase({ type: 'COMPLETE' });
            set({
              isTyping: false,
              draftsMap: { ...get().draftsMap, [activeSceneId]: finalText },
              draftPresenceMap: { ...get().draftPresenceMap, [activeSceneId]: true },
              editorReview: editorReview as EditorReview | null,
            });
          },
          onError: (message) => {
            get().transitionPhase({ type: 'ERROR', message });
            set({ isTyping: false, error: message });
            toast.error(message || 'AI 生成失败');
          },
        },
        abortController.signal,
      );
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        get().transitionPhase({ type: 'ABORT' });
        set({ isGeneratingScene: false, isTyping: false });
      } else {
        get().transitionPhase({ type: 'ERROR' });
        set({ isGeneratingScene: false, isTyping: false, error: '生成失败，无法连接大模型。' });
        toast.error('生成失败，无法连接大模型');
      }
    }
  },

  stopTyping: () => {
    const { abortControllerRef } = get();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    get().transitionPhase({ type: 'ABORT' });
    set({ isTyping: false });
  },

  transitionPhase: (event) => {
    const { generatingPhase } = get();
    const next = getNextPhase(generatingPhase, event);
    if (next !== null) {
      set({ generatingPhase: next });
    }
  },
});

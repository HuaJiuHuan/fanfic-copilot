import type { StateCreator } from 'zustand';
import { toast } from 'sonner';
import type { OutlineRecord, Project, StoryOutline, Scene } from '@/lib/types';
import { generateOutlineAction } from '@/app/actions/generate';
import { updateOutlineAction, deleteOutlineAction } from '@/app/actions/outline';
import { saveDraftAction, getDraftsByOutlineAction } from '@/app/actions/draft';
import type { GenerationSlice } from './generation.slice';

export interface EditorReviewIssue {
  severity: 'critical' | 'major' | 'minor';
  category: 'ooc' | 'continuity' | 'outline_fit' | 'prose';
  description: string;
  suggestion: string;
}

export interface EditorReview {
  verdict: 'approved' | 'needs_revision';
  summary: string;
  issues: EditorReviewIssue[];
}

export interface WorkspaceSlice {
  project: Project;
  isLoading: boolean;
  error: string;
  history: OutlineRecord[];
  selectedIndex: number;
  isEditing: boolean;
  editedOutline: StoryOutline | null;
  isWritingMode: boolean;
  isReadingView: boolean;
  activeSceneId: string | null;
  draftsMap: Record<string, string>;
  draftPresenceMap: Record<string, boolean>;
  isSavingDraft: boolean;
  confirmingDelete: boolean;

  init: (
    project: Project,
    initialHistory: OutlineRecord[],
    activeOutlineId?: string | null,
  ) => void;
  setSelectedIndex: (index: number) => void;
  startEditing: () => void;
  cancelEditing: () => void;
  updateEditedOutline: (outline: StoryOutline) => void;
  updateTitle: (title: string) => void;
  updateLogline: (logline: string) => void;
  updateActTitle: (actIdx: number, title: string) => void;
  updateScene: (actIdx: number, sceneIdx: number, field: string, value: string) => void;
  addAct: () => void;
  removeAct: (actIdx: number) => void;
  addScene: (actIdx: number) => void;
  removeScene: (actIdx: number, sceneIdx: number) => void;
  toggleDeleteConfirm: () => void;
  setActiveScene: (sceneId: string) => void;
  updateDraft: (sceneId: string, content: string) => void;
  exitWritingMode: () => void;
  enterReadingView: () => void;
  exitReadingView: () => void;

  generateOutline: () => Promise<void>;
  deleteOutline: () => Promise<void>;
  saveEditing: () => Promise<void>;
  enterWritingMode: () => Promise<void>;
  saveDraft: () => Promise<void>;
  saveAllDrafts: () => Promise<void>;
}

export function getCurrentRecord(state: WorkspaceSlice): OutlineRecord | undefined {
  return state.history[state.selectedIndex];
}

export function getCurrentOutline(state: WorkspaceSlice): StoryOutline | null {
  return getCurrentRecord(state)?.content ?? null;
}

export function getActiveSceneInfo(state: WorkspaceSlice): Scene | null {
  const outline = getCurrentOutline(state);
  if (!outline) return null;
  return outline.acts.flatMap((a) => a.scenes).find((s) => s.id === state.activeSceneId) ?? null;
}

export const createWorkspaceSlice: StateCreator<
  WorkspaceSlice & GenerationSlice,
  [],
  [],
  WorkspaceSlice
> = (set, get) => ({
  project: null as unknown as Project,
  isLoading: false,
  error: '',
  history: [],
  selectedIndex: 0,
  isEditing: false,
  editedOutline: null,
  isWritingMode: false,
  isReadingView: false,
  activeSceneId: null,
  draftsMap: {},
  draftPresenceMap: {},
  isSavingDraft: false,
  confirmingDelete: false,

  init: (project, initialHistory, activeOutlineId) => {
    let selectedIndex = 0;
    if (activeOutlineId && initialHistory.length > 0) {
      const idx = initialHistory.findIndex((o) => o.id === activeOutlineId);
      if (idx !== -1) selectedIndex = idx;
    }
    set({ project, history: initialHistory, selectedIndex });
  },

  setSelectedIndex: (index) => set({ selectedIndex: index, confirmingDelete: false }),

  startEditing: () => {
    const state = get();
    const current = getCurrentRecord(state);
    set({
      isEditing: true,
      confirmingDelete: false,
      editedOutline: current ? structuredClone(current.content) : null,
    });
  },

  cancelEditing: () => set({ isEditing: false, editedOutline: null }),

  updateEditedOutline: (outline) => set({ editedOutline: outline }),

  updateTitle: (title) => {
    const { editedOutline } = get();
    if (editedOutline) set({ editedOutline: { ...editedOutline, title } });
  },

  updateLogline: (logline) => {
    const { editedOutline } = get();
    if (editedOutline) set({ editedOutline: { ...editedOutline, logline } });
  },

  updateActTitle: (actIdx, title) => {
    const { editedOutline } = get();
    if (!editedOutline) return;
    const newActs = [...editedOutline.acts];
    newActs[actIdx] = { ...newActs[actIdx], actTitle: title };
    set({ editedOutline: { ...editedOutline, acts: newActs } });
  },

  updateScene: (actIdx, sceneIdx, field, value) => {
    const { editedOutline } = get();
    if (!editedOutline) return;
    const newActs = [...editedOutline.acts];
    const newScenes = [...newActs[actIdx].scenes];
    newScenes[sceneIdx] = { ...newScenes[sceneIdx], [field]: value };
    newActs[actIdx] = { ...newActs[actIdx], scenes: newScenes };
    set({ editedOutline: { ...editedOutline, acts: newActs } });
  },

  addAct: () => {
    const { editedOutline } = get();
    if (!editedOutline) return;
    const newAct = {
      actTitle: '新幕',
      scenes: [
        {
          id: crypto.randomUUID(),
          sceneNumber: 1,
          location: '',
          plotAction: '',
          conflict: '',
          emotionalShift: '',
        },
      ],
    };
    set({ editedOutline: { ...editedOutline, acts: [...editedOutline.acts, newAct] } });
  },

  removeAct: (actIdx) => {
    const { editedOutline } = get();
    if (!editedOutline) return;
    const newActs = editedOutline.acts.filter((_, i) => i !== actIdx);
    set({ editedOutline: { ...editedOutline, acts: newActs } });
  },

  addScene: (actIdx) => {
    const { editedOutline } = get();
    if (!editedOutline) return;
    const act = editedOutline.acts[actIdx];
    if (!act) return;
    const newScene = {
      id: crypto.randomUUID(),
      sceneNumber: act.scenes.length + 1,
      location: '',
      plotAction: '',
      conflict: '',
      emotionalShift: '',
    };
    const newActs = [...editedOutline.acts];
    newActs[actIdx] = { ...act, scenes: [...act.scenes, newScene] };
    set({ editedOutline: { ...editedOutline, acts: newActs } });
  },

  removeScene: (actIdx, sceneIdx) => {
    const { editedOutline } = get();
    if (!editedOutline) return;
    const act = editedOutline.acts[actIdx];
    if (!act || act.scenes.length <= 1) return;
    const newScenes = act.scenes.filter((_, i) => i !== sceneIdx);
    const newActs = [...editedOutline.acts];
    newActs[actIdx] = { ...act, scenes: newScenes };
    set({ editedOutline: { ...editedOutline, acts: newActs } });
  },

  toggleDeleteConfirm: () => set((s) => ({ confirmingDelete: !s.confirmingDelete })),

  setActiveScene: (sceneId) => set({ activeSceneId: sceneId }),

  updateDraft: (sceneId, content) =>
    set((s) => ({
      draftsMap: { ...s.draftsMap, [sceneId]: content },
      draftPresenceMap: { ...s.draftPresenceMap, [sceneId]: content.length > 0 },
    })),

  exitWritingMode: () => set({ isWritingMode: false }),

  enterReadingView: () => set({ isReadingView: true }),

  exitReadingView: () => set({ isReadingView: false }),

  generateOutline: async () => {
    const { project } = get();
    set({
      isLoading: true,
      error: '',
      isEditing: false,
      editedOutline: null,
      confirmingDelete: false,
    });
    try {
      const res = await generateOutlineAction(
        project.id,
        project.fandom,
        project.characters,
        project.premise,
      );
      if (res.success && res.data && res.outlineId) {
        await (
          await import('@/app/actions/project')
        ).setActiveOutlineAction(project.id, res.outlineId);
        set((s) => ({
          isLoading: false,
          history: [
            {
              id: res.outlineId!,
              content: res.data as StoryOutline,
              createdAt: new Date(),
              projectId: project.id,
              version: 1,
            },
            ...s.history,
          ],
          selectedIndex: 0,
        }));
        toast.success('大纲已生成');
      } else {
        set({ isLoading: false, error: res.error || '灵感枯竭...' });
        toast.error(res.error || '大纲生成失败，请重试');
      }
    } catch {
      set({ isLoading: false, error: '网络异常。' });
      toast.error('网络异常，请检查连接后重试');
    }
  },

  deleteOutline: async () => {
    const { history, selectedIndex, project } = get();
    const current = history[selectedIndex];
    if (!current) return;
    set({ isLoading: true, confirmingDelete: false });
    try {
      const res = await deleteOutlineAction(current.id, project.id);
      if (res.success) {
        set((s) => ({
          isLoading: false,
          history: s.history.filter((_, i) => i !== selectedIndex),
          selectedIndex: 0,
          isEditing: false,
        }));
        toast.success('大纲版本已删除');
      } else {
        set({ isLoading: false, error: res.error || '删除失败' });
        toast.error(res.error || '删除失败，请重试');
      }
    } catch {
      set({ isLoading: false, error: '网络异常。' });
      toast.error('网络异常，请检查连接后重试');
    }
  },

  saveEditing: async () => {
    const { history, selectedIndex, editedOutline, project } = get();
    const current = history[selectedIndex];
    if (!current || !editedOutline) return;
    set({ isLoading: true, error: '' });
    try {
      const res = await updateOutlineAction(current.id, editedOutline, project.id);
      if (res.success) {
        set((s) => {
          const newHistory = [...s.history];
          newHistory[selectedIndex] = { ...current, content: editedOutline };
          return { isLoading: false, history: newHistory, isEditing: false };
        });
        toast.success('大纲已保存');
      } else {
        set({ isLoading: false, error: res.error || '保存失败' });
        toast.error(res.error || '保存失败，请重试');
      }
    } catch {
      set({ isLoading: false, error: '网络异常。' });
      toast.error('网络异常，请检查连接后重试');
    }
  },

  enterWritingMode: async () => {
    const { project, history, selectedIndex } = get();
    const current = history[selectedIndex];
    if (!current) return;
    const outline = current.content;
    if (!outline) return;
    try {
      const drafts = await getDraftsByOutlineAction(project.id, current.id);
      const map: Record<string, string> = {};
      const presence: Record<string, boolean> = {};
      drafts.forEach((d) => {
        map[d.sceneId] = d.content;
        presence[d.sceneId] = d.content.length > 0;
      });
      const firstSceneId = outline.acts[0]?.scenes[0]?.id;
      if (firstSceneId) {
        set({
          isWritingMode: true,
          draftsMap: map,
          draftPresenceMap: presence,
          activeSceneId: firstSceneId,
        });
      }
    } catch {
      set({ error: '拉取正文记录失败' });
    }
  },

  saveDraft: async () => {
    const { project, history, selectedIndex, activeSceneId, draftsMap } = get();
    const current = history[selectedIndex];
    if (!activeSceneId || !current) return;
    set({ isSavingDraft: true });
    try {
      await saveDraftAction(project.id, current.id, activeSceneId, draftsMap[activeSceneId] || '');
    } catch {
      set({ error: '保存正文失败' });
      toast.error('自动保存失败');
    } finally {
      set({ isSavingDraft: false });
    }
  },

  saveAllDrafts: async () => {
    const { project, history, selectedIndex, draftsMap } = get();
    const current = history[selectedIndex];
    if (!current) return;
    set({ isSavingDraft: true });
    try {
      const entries = Object.entries(draftsMap).filter(([, content]) => content);
      await Promise.all(
        entries.map(([sceneId, content]) =>
          saveDraftAction(project.id, current.id, sceneId, content),
        ),
      );
    } catch {
      set({ error: '保存正文失败' });
    } finally {
      set({ isSavingDraft: false });
    }
  },
});

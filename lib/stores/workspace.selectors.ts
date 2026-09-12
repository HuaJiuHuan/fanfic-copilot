import type { StoryOutline, Scene } from '@/lib/types';
import { useWorkspaceStore } from './workspace.store';

export function useCurrentOutline(): StoryOutline | null {
  return useWorkspaceStore((s) => {
    const record = s.history[s.selectedIndex];
    return record?.content ?? null;
  });
}

export function useDisplayData(): StoryOutline | null {
  return useWorkspaceStore((s) => {
    if (s.isEditing && s.editedOutline) return s.editedOutline;
    const record = s.history[s.selectedIndex];
    return record?.content ?? null;
  });
}

export function useActiveSceneInfo(): Scene | null {
  return useWorkspaceStore((s) => {
    const record = s.history[s.selectedIndex];
    const content = record?.content;
    if (!content) return null;
    return content.acts.flatMap((a) => a.scenes).find((sc) => sc.id === s.activeSceneId) ?? null;
  });
}

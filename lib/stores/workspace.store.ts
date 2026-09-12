import { create } from 'zustand';
import { createWorkspaceSlice, type WorkspaceSlice } from './workspace.slice';
import { createGenerationSlice, type GenerationSlice } from './generation.slice';

export const useWorkspaceStore = create<WorkspaceSlice & GenerationSlice>()((...a) => ({
  ...createWorkspaceSlice(...a),
  ...createGenerationSlice(...a),
}));

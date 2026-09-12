'use server';

import { revalidatePath } from 'next/cache';
import { getDraftsByOutline, upsertDraft } from '@/lib/repositories/draft.repository';
import { getUserIdOrThrow, verifyProjectOwnership } from '@/lib/server/auth-guard';

export async function getDraftsByOutlineAction(projectId: string, outlineId: string) {
  const userId = await getUserIdOrThrow();
  if (!(await verifyProjectOwnership(projectId, userId))) {
    throw new Error('无权访问此项目');
  }
  return await getDraftsByOutline(projectId, outlineId);
}

export async function saveDraftAction(
  projectId: string,
  outlineId: string,
  sceneId: string,
  content: string,
) {
  const userId = await getUserIdOrThrow();
  if (!(await verifyProjectOwnership(projectId, userId))) {
    return { success: false, error: '无权操作此项目' };
  }

  try {
    await upsertDraft(projectId, outlineId, sceneId, content);
    revalidatePath(`/project/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error('保存正文失败:', error);
    return { success: false, error: '自动保存失败' };
  }
}

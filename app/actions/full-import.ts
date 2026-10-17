'use server';

import { mastra } from '@/mastra';
import { getUserIdOrThrow } from '@/lib/server/auth-guard';
import type { CharacterProfile } from '@/lib/types';

export async function fullImportAction(
  title: string,
  fandom: string,
  characters: string,
  premise: string,
  storyText: string,
  characterProfiles?: CharacterProfile[],
) {
  try {
    const userId = await getUserIdOrThrow();

    const workflow = mastra.getWorkflow('fullImportWorkflow');

    const run = await workflow.createRun({
      resourceId: `import-${Date.now()}`,
    });

    const result = await run.start({
      inputData: { userId, title, fandom, characters, premise, storyText, characterProfiles },
    });

    if (result.status !== 'success') {
      return { success: false, error: '导入过程中出现错误，请重试。' };
    }

    const projectId = result.result.projectId;

    return { success: true, projectId };
  } catch (error) {
    console.error('全量导入失败:', error);
    return { success: false, error: '导入过程中出现错误，请重试。' };
  }
}
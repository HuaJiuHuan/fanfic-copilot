'use server';

import { mastra } from '@/mastra';
import { getUserIdOrThrow, verifyProjectOwnership } from '@/lib/server/auth-guard';
import {
  buildWritingPrompt,
  buildEditingPrompt,
  buildSettingAgentPrompt,
  parseEditorOutput,
  type SceneInfo,
} from '@/lib/services/prompt.service';

export async function generateSceneDraftAction(
  projectId: string,
  fandom: string,
  characters: string,
  premise: string,
  sceneInfo: SceneInfo,
) {
  try {
    const userId = await getUserIdOrThrow();
    if (!(await verifyProjectOwnership(projectId, userId))) {
      return { success: false, error: '无权操作此项目' };
    }

    const settingAgent = mastra.getAgent('settingAgent');
    const settingResult = await settingAgent.generate(
      buildSettingAgentPrompt(projectId, sceneInfo),
      {
        memory: {
          thread: { id: `setting-project-${projectId}`, resourceId: projectId },
          resource: projectId,
        },
      },
    );
    const settingBrief = settingResult.text;

    const writingAgent = mastra.getAgent('writingAgent');
    const writeResult = await writingAgent.generate(
      buildWritingPrompt({ settingBrief, fandom, characters, premise, sceneInfo, projectId }),
      {
        memory: {
          thread: { id: `project-${projectId}`, resourceId: projectId },
          resource: projectId,
        },
      },
    );
    const draftText = writeResult.text;

    const editorAgent = mastra.getAgent('editorAgent');
    const editorResult = await editorAgent.generate(
      buildEditingPrompt({
        settingBrief,
        fandom,
        characters,
        premise,
        sceneInfo,
        draftText,
        projectId,
      }),
      {
        memory: {
          thread: { id: `editor-project-${projectId}`, resourceId: projectId },
          resource: projectId,
        },
      },
    );

    const editorRaw = editorResult.text;
    const review = parseEditorOutput(editorRaw);
    const finalText = review?.revisedText || draftText;

    return {
      success: true,
      text: finalText,
      editorReview: review
        ? {
            verdict: review.verdict,
            summary: review.summary,
            issues: review.issues,
          }
        : null,
    };
  } catch (error) {
    console.error('生成场景正文失败:', error);
    return { success: false, error: '执笔过程中灵感中断，请重试。' };
  }
}

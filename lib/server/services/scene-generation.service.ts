import { mastra } from '@/mastra';
import {
  buildWritingPrompt,
  buildEditingPrompt,
  buildSettingAgentPrompt,
  parseEditorOutput,
  type EditorReview,
  type SceneInfo,
} from '@/lib/services/prompt.service';

export interface GenerationEvent {
  phase: string;
  status?: string;
  chunk?: string;
  accumulated?: string;
  finalText?: string;
  editorReview?: {
    verdict: EditorReview['verdict'];
    summary: string;
    issues: EditorReview['issues'];
  } | null;
  message?: string;
}

interface GenerateSceneParams {
  projectId: string;
  fandom: string;
  characters: string;
  premise: string;
  sceneInfo: SceneInfo;
}

export async function* generateSceneStream(
  params: GenerateSceneParams,
): AsyncGenerator<GenerationEvent> {
  const { projectId, fandom, characters, premise, sceneInfo } = params;

  yield { phase: 'setting', status: 'generating' };

  const settingAgent = mastra.getAgent('settingAgent');
  const settingResult = await settingAgent.generate(buildSettingAgentPrompt(projectId, sceneInfo), {
    memory: {
      thread: { id: `setting-project-${projectId}`, resourceId: projectId },
      resource: projectId,
    },
  });
  const settingBrief = settingResult.text;
  yield { phase: 'setting', status: 'done' };

  yield { phase: 'writing', status: 'streaming' };
  const writingAgent = mastra.getAgent('writingAgent');
  const writeStream = await writingAgent.stream(
    buildWritingPrompt({ settingBrief, fandom, characters, premise, sceneInfo, projectId }),
    {
      memory: {
        thread: { id: `project-${projectId}`, resourceId: projectId },
        resource: projectId,
      },
    },
  );

  let draftText = '';
  for await (const chunk of writeStream.textStream) {
    draftText += chunk;
    yield { phase: 'writing', chunk, accumulated: draftText };
  }
  yield { phase: 'writing', status: 'done' };

  yield { phase: 'editing', status: 'streaming' };
  const editorAgent = mastra.getAgent('editorAgent');
  const editStream = await editorAgent.stream(
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

  let editorRaw = '';
  for await (const chunk of editStream.textStream) {
    editorRaw += chunk;
    yield { phase: 'editing', chunk, accumulated: editorRaw };
  }
  yield { phase: 'editing', status: 'done' };

  const review = parseEditorOutput(editorRaw);
  const finalText = review?.revisedText || draftText;

  yield {
    phase: 'complete',
    finalText,
    editorReview: review
      ? { verdict: review.verdict, summary: review.summary, issues: review.issues }
      : null,
  };
}

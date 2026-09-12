import { generateSceneStream } from '@/lib/server/services/scene-generation.service';
import type { SceneInfo } from '@/lib/services/prompt.service';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects } from '@/lib/db-schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: Request) {
  const session = await getAuthSession();
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { projectId, fandom, characters, premise, sceneInfo } = (await req.json()) as {
    projectId: string;
    fandom: string;
    characters: string;
    premise: string;
    sceneInfo: SceneInfo;
  };

  const [project] = await db
    .select({ userId: projects.userId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project || project.userId !== userId) {
    return new Response('Forbidden', { status: 403 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of generateSceneStream({
          projectId,
          fandom,
          characters,
          premise,
          sceneInfo,
        })) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ phase: 'error', message: error instanceof Error ? error.message : '未知错误' })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

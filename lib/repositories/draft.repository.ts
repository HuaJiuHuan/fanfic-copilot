import { db } from '@/lib/db';
import { sceneDrafts } from '@/lib/db-schema';
import { and, eq } from 'drizzle-orm';

export async function getDraftsByOutline(projectId: string, outlineId: string) {
  return await db
    .select()
    .from(sceneDrafts)
    .where(and(eq(sceneDrafts.projectId, projectId), eq(sceneDrafts.outlineId, outlineId)));
}

export async function upsertDraft(
  projectId: string,
  outlineId: string,
  sceneId: string,
  content: string,
) {
  const existing = await db
    .select()
    .from(sceneDrafts)
    .where(and(eq(sceneDrafts.outlineId, outlineId), eq(sceneDrafts.sceneId, sceneId)))
    .limit(1);

  const wordCount = content.trim().length;

  if (existing.length > 0) {
    await db
      .update(sceneDrafts)
      .set({ content, wordCount, updatedAt: new Date() })
      .where(eq(sceneDrafts.id, existing[0].id));
  } else {
    await db.insert(sceneDrafts).values({
      projectId,
      outlineId,
      sceneId,
      content,
      wordCount,
    });
  }
}

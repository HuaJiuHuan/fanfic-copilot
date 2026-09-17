'use server';

import { cache } from 'react';
import { db } from '@/lib/db';
import { projects } from '@/lib/db-schema';
import { and, desc, eq } from 'drizzle-orm';
import { getUserIdOrThrow } from '@/lib/server/auth-guard';
import type { TagsData } from '@/lib/types';

export async function publishProject(projectId: string, summary: string, tags: TagsData) {
  const userId = await getUserIdOrThrow();

  const [project] = await db
    .select({ userId: projects.userId })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (!project) {
    throw new Error('项目不存在或无权操作');
  }

  await db
    .update(projects)
    .set({
      isPublished: true,
      publishedAt: new Date(),
      summary,
      tags,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));

  return { success: true };
}

export async function unpublishProject(projectId: string) {
  const userId = await getUserIdOrThrow();

  const [project] = await db
    .select({ userId: projects.userId })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (!project) {
    throw new Error('项目不存在或无权操作');
  }

  await db
    .update(projects)
    .set({ isPublished: false, updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  return { success: true };
}

export const getPublishedProjects = cache(async () => {
  return db
    .select()
    .from(projects)
    .where(eq(projects.isPublished, true))
    .orderBy(desc(projects.publishedAt));
});
'use server';

import { cache } from 'react';
import { db } from '@/lib/db';
import { projects, subscriptions } from '@/lib/db-schema';
import { and, desc, eq } from 'drizzle-orm';
import { getUserIdOrThrow } from '@/lib/server/auth-guard';
import type { TagsData } from '@/lib/types';
import { createNotification } from '@/app/actions/notifications';

export async function publishProject(projectId: string, summary: string, tags: TagsData) {
  const userId = await getUserIdOrThrow();

  const [project] = await db
    .select({ userId: projects.userId, isPublished: projects.isPublished, title: projects.title })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (!project) {
    throw new Error('项目不存在或无权操作');
  }

  const wasPublished = project.isPublished;

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

  if (!wasPublished) {
    const subs = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.targetType, 'author'), eq(subscriptions.targetId, userId)));
    for (const sub of subs) {
      await createNotification({
        userId: sub.userId,
        actorId: userId,
        type: 'subscription_author',
        projectId,
      });
    }
  } else {
    const subs = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.targetType, 'project'), eq(subscriptions.targetId, projectId)));
    for (const sub of subs) {
      await createNotification({
        userId: sub.userId,
        actorId: userId,
        type: 'subscription_project',
        projectId,
      });
    }
  }

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
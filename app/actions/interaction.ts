'use server';

import { cache } from 'react';
import { db } from '@/lib/db';
import { kudos, subscriptions, projects, readingHistory, comments } from '@/lib/db-schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import { getUserIdOrThrow } from '@/lib/server/auth-guard';
import { revalidatePath } from 'next/cache';
import type { InteractionState, Kudos, Subscription, ReadingHistory } from '@/lib/types';
import { createNotification } from '@/app/actions/notifications';

export async function toggleKudos(projectId: string): Promise<{
  success: boolean;
  kudosCount: number;
  isKudosed: boolean;
  error?: string;
}> {
  try {
    const userId = await getUserIdOrThrow();

    const [existing] = await db
      .select()
      .from(kudos)
      .where(and(eq(kudos.userId, userId), eq(kudos.projectId, projectId)))
      .limit(1);

    if (existing) {
      await db.delete(kudos).where(eq(kudos.id, existing.id));
    } else {
      await db.insert(kudos).values({
        id: crypto.randomUUID(),
        userId,
        projectId,
      });

      const [project] = await db
        .select({ userId: projects.userId })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);
      if (project) {
        await createNotification({
          userId: project.userId,
          actorId: userId,
          type: 'kudos',
          projectId,
        });
      }
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(kudos)
      .where(eq(kudos.projectId, projectId));

    revalidatePath(`/story/${projectId}`);
    revalidatePath('/discover');

    return {
      success: true,
      kudosCount: result?.count ?? 0,
      isKudosed: !existing,
    };
  } catch (error) {
    console.error('Kudos 操作失败:', error);
    return { success: false, kudosCount: 0, isKudosed: false, error: '操作失败，请重试。' };
  }
}

export async function toggleSubscription(
  targetType: 'author' | 'project',
  targetId: string,
): Promise<{
  success: boolean;
  isSubscribed: boolean;
  subscriptionCount: number;
  error?: string;
}> {
  try {
    const userId = await getUserIdOrThrow();

    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.targetType, targetType),
          eq(subscriptions.targetId, targetId),
        ),
      )
      .limit(1);

    if (existing) {
      await db.delete(subscriptions).where(eq(subscriptions.id, existing.id));
    } else {
      await db.insert(subscriptions).values({
        id: crypto.randomUUID(),
        userId,
        targetType,
        targetId,
      });

      if (targetType === 'project') {
        const [project] = await db
          .select({ userId: projects.userId })
          .from(projects)
          .where(eq(projects.id, targetId))
          .limit(1);
        if (project) {
          await createNotification({
            userId: project.userId,
            actorId: userId,
            type: 'subscription_project',
            projectId: targetId,
          });
        }
      } else {
        await createNotification({
          userId: targetId,
          actorId: userId,
          type: 'subscription_author',
        });
      }
    }

    const [subResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(and(eq(subscriptions.targetType, targetType), eq(subscriptions.targetId, targetId)));

    return {
      success: true,
      isSubscribed: !existing,
      subscriptionCount: subResult?.count ?? 0,
    };
  } catch (error) {
    console.error('Subscription 操作失败:', error);
    return { success: false, isSubscribed: false, subscriptionCount: 0, error: '操作失败，请重试。' };
  }
}

export async function recordRead(projectId: string): Promise<void> {
  try {
    const userId = await getUserIdOrThrow();

    await db
      .update(projects)
      .set({ hits: sql`${projects.hits} + 1` })
      .where(eq(projects.id, projectId));

    const [existing] = await db
      .select()
      .from(readingHistory)
      .where(
        and(eq(readingHistory.userId, userId), eq(readingHistory.projectId, projectId)),
      )
      .limit(1);

    if (existing) {
      await db
        .update(readingHistory)
        .set({ lastReadAt: new Date() })
        .where(eq(readingHistory.id, existing.id));
    } else {
      await db.insert(readingHistory).values({
        id: crypto.randomUUID(),
        userId,
        projectId,
      });
    }
  } catch (error) {
    console.error('阅读记录失败:', error);
  }
}

export const getInteractionState = cache(
  async (projectId: string): Promise<InteractionState> => {
    const empty: InteractionState = {
      kudosCount: 0,
      isKudosed: false,
      commentCount: 0,
      subscriptionCount: 0,
      isSubscribed: false,
    };

    try {
      const userId = await getUserIdOrThrow();

      const [kudosResult, commentResult, subResult, userKudos, userSub] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(kudos).where(eq(kudos.projectId, projectId)),
        db.select({ count: sql<number>`count(*)` }).from(comments).where(eq(comments.projectId, projectId)),
        db.select({ count: sql<number>`count(*)` }).from(subscriptions).where(eq(subscriptions.targetId, projectId)),
        db
          .select()
          .from(kudos)
          .where(and(eq(kudos.userId, userId), eq(kudos.projectId, projectId)))
          .limit(1),
        db
          .select()
          .from(subscriptions)
          .where(and(eq(subscriptions.userId, userId), eq(subscriptions.targetId, projectId)))
          .limit(1),
      ]);

      return {
        kudosCount: kudosResult[0]?.count ?? 0,
        isKudosed: userKudos.length > 0,
        commentCount: commentResult[0]?.count ?? 0,
        subscriptionCount: subResult[0]?.count ?? 0,
        isSubscribed: userSub.length > 0,
      };
    } catch {
      return empty;
    }
  },
);

export const getUserReadingHistory = cache(async (): Promise<ReadingHistory[]> => {
  const userId = await getUserIdOrThrow();

  return (await db
    .select()
    .from(readingHistory)
    .where(eq(readingHistory.userId, userId))
    .orderBy(desc(readingHistory.lastReadAt))) as ReadingHistory[];
});

export const getUserSubscriptions = cache(async (): Promise<Subscription[]> => {
  const userId = await getUserIdOrThrow();

  return (await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))) as Subscription[];
});
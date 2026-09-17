'use server';

import { cache } from 'react';
import { db } from '@/lib/db';
import { kudos, bookmarks, subscriptions, projects, readingHistory, comments } from '@/lib/db-schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import { getUserIdOrThrow } from '@/lib/server/auth-guard';
import { revalidatePath } from 'next/cache';
import type { InteractionState, Kudos, Bookmark, Subscription, ReadingHistory } from '@/lib/types';

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

export async function toggleBookmark(
  projectId: string,
  isPrivate: boolean = false,
  note: string = '',
): Promise<{
  success: boolean;
  bookmarkCount: number;
  isBookmarked: boolean;
  error?: string;
}> {
  try {
    const userId = await getUserIdOrThrow();

    const [existing] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.projectId, projectId)))
      .limit(1);

    if (existing) {
      await db.delete(bookmarks).where(eq(bookmarks.id, existing.id));
    } else {
      await db.insert(bookmarks).values({
        id: crypto.randomUUID(),
        userId,
        projectId,
        isPrivate,
        note,
      });
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarks)
      .where(eq(bookmarks.projectId, projectId));

    revalidatePath(`/story/${projectId}`);

    return {
      success: true,
      bookmarkCount: result?.count ?? 0,
      isBookmarked: !existing,
    };
  } catch (error) {
    console.error('Bookmark 操作失败:', error);
    return { success: false, bookmarkCount: 0, isBookmarked: false, error: '操作失败，请重试。' };
  }
}

export async function toggleSubscription(
  targetType: 'author' | 'project',
  targetId: string,
): Promise<{
  success: boolean;
  isSubscribed: boolean;
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
    }

    return {
      success: true,
      isSubscribed: !existing,
    };
  } catch (error) {
    console.error('Subscription 操作失败:', error);
    return { success: false, isSubscribed: false, error: '操作失败，请重试。' };
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
      bookmarkCount: 0,
      isBookmarked: false,
      commentCount: 0,
    };

    try {
      const userId = await getUserIdOrThrow();

      const [kudosResult, bookmarkResult, commentResult, userKudos, userBookmark] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(kudos).where(eq(kudos.projectId, projectId)),
        db.select({ count: sql<number>`count(*)` }).from(bookmarks).where(eq(bookmarks.projectId, projectId)),
        db.select({ count: sql<number>`count(*)` }).from(comments).where(eq(comments.projectId, projectId)),
        db
          .select()
          .from(kudos)
          .where(and(eq(kudos.userId, userId), eq(kudos.projectId, projectId)))
          .limit(1),
        db
          .select()
          .from(bookmarks)
          .where(and(eq(bookmarks.userId, userId), eq(bookmarks.projectId, projectId)))
          .limit(1),
      ]);

      return {
        kudosCount: kudosResult[0]?.count ?? 0,
        isKudosed: userKudos.length > 0,
        bookmarkCount: bookmarkResult[0]?.count ?? 0,
        isBookmarked: userBookmark.length > 0,
        commentCount: commentResult[0]?.count ?? 0,
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

export const getUserBookmarks = cache(async (): Promise<Bookmark[]> => {
  const userId = await getUserIdOrThrow();

  return (await db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt))) as Bookmark[];
});

export const getUserSubscriptions = cache(async (): Promise<Subscription[]> => {
  const userId = await getUserIdOrThrow();

  return (await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))) as Subscription[];
});
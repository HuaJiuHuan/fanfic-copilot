'use server';

import { cache } from 'react';
import { db } from '@/lib/db';
import { notifications, users } from '@/lib/db-schema';
import { desc, eq, and, sql } from 'drizzle-orm';
import { getUserIdOrThrow } from '@/lib/server/auth-guard';
import { revalidatePath } from 'next/cache';
import type { NotificationWithActor } from '@/lib/types';

export async function createNotification(params: {
  userId: string;
  actorId: string;
  type: string;
  projectId?: string;
  commentId?: string;
}): Promise<void> {
  if (params.userId === params.actorId) return;

  try {
    await db.insert(notifications).values({
      id: crypto.randomUUID(),
      userId: params.userId,
      actorId: params.actorId,
      type: params.type,
      projectId: params.projectId ?? null,
      commentId: params.commentId ?? null,
    });
  } catch (error) {
    console.error('创建通知失败:', error);
  }
}

export const getNotifications = cache(async (): Promise<NotificationWithActor[]> => {
  const userId = await getUserIdOrThrow();

  const rows = await db
    .select({
      id: notifications.id,
      userId: notifications.userId,
      actorId: notifications.actorId,
      type: notifications.type,
      projectId: notifications.projectId,
      commentId: notifications.commentId,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
      actorName: users.name,
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.actorId, users.id))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return rows as NotificationWithActor[];
});

export const getUnreadCount = cache(async (): Promise<number> => {
  const userId = await getUserIdOrThrow();

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  return result?.count ?? 0;
});

export async function markAsRead(notificationId: string): Promise<void> {
  const userId = await getUserIdOrThrow();

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));

  revalidatePath('/');
}

export async function markAllAsRead(): Promise<void> {
  const userId = await getUserIdOrThrow();

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  revalidatePath('/');
}
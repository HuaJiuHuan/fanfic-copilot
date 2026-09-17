'use server';

import { cache } from 'react';
import { db } from '@/lib/db';
import { comments, users } from '@/lib/db-schema';
import { asc, eq, sql } from 'drizzle-orm';
import { getUserIdOrThrow } from '@/lib/server/auth-guard';
import { revalidatePath } from 'next/cache';
import type { Comment, CommentWithUser } from '@/lib/types';

interface CommentRow {
  id: string;
  userId: string;
  projectId: string;
  parentId: string | null;
  content: string;
  isDeleted: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  userName: string | null;
}

function buildCommentTree(rows: CommentRow[]): CommentWithUser[] {
  const topLevel: CommentWithUser[] = [];
  const childrenMap = new Map<string, CommentWithUser[]>();

  for (const row of rows) {
    const node: CommentWithUser = {
      id: row.id,
      userId: row.userId,
      projectId: row.projectId,
      parentId: row.parentId,
      content: row.content,
      isDeleted: row.isDeleted ?? false,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      userName: row.userName,
      replies: [],
    };

    if (row.parentId) {
      const siblings = childrenMap.get(row.parentId) || [];
      siblings.push(node);
      childrenMap.set(row.parentId, siblings);
    } else {
      topLevel.push(node);
    }
  }

  function attachReplies(nodes: CommentWithUser[]): CommentWithUser[] {
    return nodes.map((node) => ({
      ...node,
      replies: attachReplies(childrenMap.get(node.id) || []),
    }));
  }

  return attachReplies(topLevel);
}

export const getComments = cache(async (projectId: string): Promise<CommentWithUser[]> => {
  try {
    const rows = (await db
      .select({
        id: comments.id,
        userId: comments.userId,
        projectId: comments.projectId,
        parentId: comments.parentId,
        content: comments.content,
        isDeleted: comments.isDeleted,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        userName: users.name,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.projectId, projectId))
      .orderBy(asc(comments.createdAt))) as CommentRow[];

    return buildCommentTree(rows);
  } catch (error) {
    console.error('获取评论失败:', error);
    return [];
  }
});

export const getCommentCount = cache(async (projectId: string): Promise<number> => {
  try {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(eq(comments.projectId, projectId));

    return result?.count ?? 0;
  } catch {
    return 0;
  }
});

export async function addComment(
  projectId: string,
  content: string,
  parentId?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getUserIdOrThrow();

    if (!content.trim()) {
      return { success: false, error: '评论内容不能为空。' };
    }

    if (content.length > 2000) {
      return { success: false, error: '评论内容不能超过 2000 字。' };
    }

    if (parentId) {
      const [parent] = await db
        .select({ id: comments.id, isDeleted: comments.isDeleted })
        .from(comments)
        .where(eq(comments.id, parentId))
        .limit(1);

      if (!parent || parent.isDeleted) {
        return { success: false, error: '无法回复该评论。' };
      }
    }

    await db.insert(comments).values({
      id: crypto.randomUUID(),
      userId,
      projectId,
      parentId: parentId || null,
      content: content.trim(),
    });

    revalidatePath(`/story/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error('发表评论失败:', error);
    return { success: false, error: '发表评论失败，请重试。' };
  }
}

export async function deleteComment(
  commentId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getUserIdOrThrow();

    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (!comment) {
      return { success: false, error: '评论不存在。' };
    }

    if (comment.userId !== userId) {
      return { success: false, error: '只能删除自己的评论。' };
    }

    await db
      .update(comments)
      .set({ isDeleted: true, content: '', updatedAt: new Date() })
      .where(eq(comments.id, commentId));

    return { success: true };
  } catch (error) {
    console.error('删除评论失败:', error);
    return { success: false, error: '删除评论失败，请重试。' };
  }
}
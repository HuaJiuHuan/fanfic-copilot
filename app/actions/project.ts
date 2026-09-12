'use server';

import { cache } from 'react';
import { db } from '@/lib/db';
import { projects, outlines } from '@/lib/db-schema';
import { desc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { getProjectsWithStats as fetchProjectsWithStats } from '@/lib/repositories/project.repository';
import type { ProjectWithStats } from '@/lib/repositories/project.repository';
import { getUserIdOrThrow } from '@/lib/server/auth-guard';

export { type ProjectWithStats };

export async function getProjects() {
  const userId = await getUserIdOrThrow();
  return await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt));
}

export const getProjectsWithStats = cache(async () => {
  const userId = await getUserIdOrThrow();
  return fetchProjectsWithStats(userId);
});

export async function getProjectById(id: string) {
  const userId = await getUserIdOrThrow();
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  const project = result[0] || null;
  if (!project) return null;
  if (project.userId !== userId) return null;
  return project;
}

export async function createProjectAction(formData: FormData) {
  const userId = await getUserIdOrThrow();
  const title = formData.get('title') as string;
  const fandom = formData.get('fandom') as string;
  const characters = formData.get('characters') as string;
  const premise = formData.get('premise') as string;

  const id = crypto.randomUUID();
  await db.insert(projects).values({ id, userId, title, fandom, characters, premise });

  redirect(`/project/${id}`);
}

export async function deleteProjectAction(projectId: string) {
  try {
    const userId = await getUserIdOrThrow();
    const project = await getProjectById(projectId);
    if (!project) {
      return { success: false, error: '项目不存在或无权访问。' };
    }
    await db.delete(projects).where(eq(projects.id, projectId));
    return { success: true };
  } catch (error) {
    console.error('销毁项目失败:', error);
    return { success: false, error: '项目销毁失败，请重试。' };
  }
}

export async function setActiveOutlineAction(projectId: string, outlineId: string) {
  try {
    const userId = await getUserIdOrThrow();
    await db
      .update(projects)
      .set({ activeOutlineId: outlineId, updatedAt: new Date() })
      .where(eq(projects.id, projectId));
    return { success: true };
  } catch (error) {
    console.error('切换大纲失败:', error);
    return { success: false, error: '切换大纲失败，请重试。' };
  }
}

export async function getOutlinesByProject(projectId: string) {
  const userId = await getUserIdOrThrow();
  const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (project.length === 0 || project[0].userId !== userId) {
    throw new Error('Project not found');
  }
  return await db
    .select()
    .from(outlines)
    .where(eq(outlines.projectId, projectId))
    .orderBy(desc(outlines.createdAt));
}

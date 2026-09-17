import { db } from '@/lib/db';
import { projects, outlines, sceneDrafts, kudos, bookmarks, comments } from '@/lib/db-schema';
import { desc, inArray, eq, sql } from 'drizzle-orm';

export interface ProjectWithStats {
  id: string;
  title: string;
  fandom: string;
  characters: string;
  premise: string;
  isPublished: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  totalWords: number;
  sceneCount: number;
  hasContent: boolean;
  kudosCount: number;
  bookmarkCount: number;
  commentCount: number;
}

export async function getProjectsWithStats(userId: string): Promise<ProjectWithStats[]> {
  const projectList = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt));

  if (projectList.length === 0) return [];

  const allProjectIds = projectList.map((p) => p.id);

  const fallbackStats = { kudosCount: 0, bookmarkCount: 0, commentCount: 0 };
  const statsMap = new Map<string, typeof fallbackStats>();
  for (const pid of allProjectIds) {
    statsMap.set(pid, { kudosCount: 0, bookmarkCount: 0, commentCount: 0 });
  }
  const [kudosRows, bookmarkRows, commentRows] = await Promise.all([
    db
      .select({ projectId: kudos.projectId, count: sql<number>`count(*)` })
      .from(kudos)
      .where(inArray(kudos.projectId, allProjectIds))
      .groupBy(kudos.projectId),
    db
      .select({ projectId: bookmarks.projectId, count: sql<number>`count(*)` })
      .from(bookmarks)
      .where(inArray(bookmarks.projectId, allProjectIds))
      .groupBy(bookmarks.projectId),
    db
      .select({ projectId: comments.projectId, count: sql<number>`count(*)` })
      .from(comments)
      .where(inArray(comments.projectId, allProjectIds))
      .groupBy(comments.projectId),
  ]);
  for (const row of kudosRows) {
    const s = statsMap.get(row.projectId);
    if (s) s.kudosCount = row.count;
  }
  for (const row of bookmarkRows) {
    const s = statsMap.get(row.projectId);
    if (s) s.bookmarkCount = row.count;
  }
  for (const row of commentRows) {
    const s = statsMap.get(row.projectId);
    if (s) s.commentCount = row.count;
  }

  const allOutlines = await db
    .select()
    .from(outlines)
    .where(inArray(outlines.projectId, allProjectIds))
    .orderBy(desc(outlines.createdAt));

  const latestOutlineByProject = new Map<string, string>();
  const outlineMap = new Map<
    string,
    typeof outlines.$inferSelect & {
      content: { acts?: { scenes?: { id?: string }[] }[] };
    }
  >();
  for (const o of allOutlines) {
    if (!latestOutlineByProject.has(o.projectId)) {
      latestOutlineByProject.set(o.projectId, o.id);
    }
    outlineMap.set(o.id, o as any);
  }

  const allOutlineIds = allOutlines.map((o) => o.id);
  const draftsByOutline = new Map<string, (typeof sceneDrafts.$inferSelect)[]>();
  if (allOutlineIds.length > 0) {
    const allDrafts = await db
      .select()
      .from(sceneDrafts)
      .where(inArray(sceneDrafts.outlineId, allOutlineIds));
    for (const d of allDrafts) {
      const list = draftsByOutline.get(d.outlineId) || [];
      list.push(d);
      draftsByOutline.set(d.outlineId, list);
    }
  }

  const result: ProjectWithStats[] = [];

  for (const proj of projectList) {
    const outlineId = proj.activeOutlineId || latestOutlineByProject.get(proj.id) || null;

    if (!outlineId) {
      result.push({ ...proj, totalWords: 0, sceneCount: 0, hasContent: false, ...(statsMap.get(proj.id) ?? fallbackStats) });
      continue;
    }

    const outline = outlineMap.get(outlineId);
    if (!outline) {
      result.push({ ...proj, totalWords: 0, sceneCount: 0, hasContent: false, ...(statsMap.get(proj.id) ?? fallbackStats) });
      continue;
    }

    const outlineContent = outline.content as {
      acts?: { scenes?: { id?: string }[] }[];
    };
    const sceneIds =
      outlineContent?.acts?.flatMap((act) => act.scenes?.map((s) => s.id).filter(Boolean) ?? []) ??
      [];

    if (sceneIds.length === 0) {
      result.push({ ...proj, totalWords: 0, sceneCount: 0, hasContent: false, ...(statsMap.get(proj.id) ?? fallbackStats) });
      continue;
    }

    const drafts = draftsByOutline.get(outlineId) || [];
    const totalWords = drafts.reduce((sum, d) => sum + (d.wordCount || 0), 0);
    const filledScenes = drafts.filter((d) => d.content && d.content.trim().length > 0).length;

    result.push({
      ...proj,
      totalWords,
      sceneCount: sceneIds.length,
      hasContent: filledScenes > 0,
      ...(statsMap.get(proj.id) ?? fallbackStats),
    });
  }

  return result;
}
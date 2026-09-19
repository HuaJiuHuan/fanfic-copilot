import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects, users, kudos, bookmarks, comments } from '@/lib/db-schema';
import { inArray, desc, eq, sql } from 'drizzle-orm';
import AppHeader from '@/components/AppHeader';
import type { Project } from '@/lib/types';
import DiscoverClient from './DiscoverClient';
import type { TagStats } from './DiscoverClient';
import { parseTags } from '@/lib/tag-utils';

export const metadata: Metadata = {
  title: '作品广场',
  description: '浏览所有已发布的同人小说作品',
};

function computeTagStats(list: Project[]): TagStats {
  const tagCounts: Record<string, number> = {};

  for (const proj of list) {
    const tags = parseTags(proj.tags);
    if (!tags) continue;

    for (const t of tags.preset) {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    }
  }

  return { tags: tagCounts };
}

export default async function DiscoverPage() {
  const session = await getAuthSession();
  if (!session) {
    redirect('/login');
  }

  const user = session.user as any;
  const userId = user?.id as string;

  const publishedList = (await db
    .select()
    .from(projects)
    .where(eq(projects.isPublished, true))
    .orderBy(desc(projects.publishedAt))) as Project[];

  const authorIds = [...new Set(publishedList.map((p) => p.userId))];
  const authorList = authorIds.length > 0
    ? await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, authorIds))
    : [];

  const authorMap: Record<string, string> = {};
  for (const a of authorList) {
    authorMap[a.id] = a.name || '匿名创作者';
  }

  const tagStats = computeTagStats(publishedList);

  const projectIds = publishedList.map((p) => p.id);
  const interactionMap: Record<string, { kudos: number; bookmarks: number; comments: number }> = {};

  if (projectIds.length > 0) {
    const [kudosRows, bookmarkRows, commentRows] = await Promise.all([
      db
        .select({ projectId: kudos.projectId, count: sql<number>`count(*)` })
        .from(kudos)
        .where(inArray(kudos.projectId, projectIds))
        .groupBy(kudos.projectId),
      db
        .select({ projectId: bookmarks.projectId, count: sql<number>`count(*)` })
        .from(bookmarks)
        .where(inArray(bookmarks.projectId, projectIds))
        .groupBy(bookmarks.projectId),
      db
        .select({ projectId: comments.projectId, count: sql<number>`count(*)` })
        .from(comments)
        .where(inArray(comments.projectId, projectIds))
        .groupBy(comments.projectId),
    ]);

    for (const pid of projectIds) {
      interactionMap[pid] = { kudos: 0, bookmarks: 0, comments: 0 };
    }
    for (const row of kudosRows) interactionMap[row.projectId].kudos = row.count;
    for (const row of bookmarkRows) interactionMap[row.projectId].bookmarks = row.count;
    for (const row of commentRows) interactionMap[row.projectId].comments = row.count;
  }

  return (
    <div className="min-h-screen bg-academia-bg text-academia-parchment font-sans selection:bg-academia-gold/20">
      <AppHeader
        breadcrumbs={[
          { label: '我的项目', href: '/' },
          { label: '作品广场' },
        ]}
        username={user?.name || user?.email?.split('@')[0] || '读者'}
      />

      <main className="max-w-6xl mx-auto p-6 md:p-12 space-y-6">
        <div className="space-y-2 border-b border-academia-border pb-4">
          <h1 className="text-3xl font-serif font-bold text-academia-parchment">作品广场</h1>
          <p className="text-sm text-academia-muted">发现精彩的同人创作。</p>
        </div>

        <DiscoverClient
          projects={publishedList}
          authorMap={authorMap}
          userId={userId}
          tagStats={tagStats}
          interactionMap={interactionMap}
        />
      </main>
    </div>
  );
}
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects, users, outlines, sceneDrafts } from '@/lib/db-schema';
import { desc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { OutlineRecord, SceneDraft, Project } from '@/lib/types';
import { getInteractionState } from '@/app/actions/interaction';
import AppHeader from '@/components/AppHeader';
import StoryReader from './StoryReader';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [project] = await db
    .select({ title: projects.title, summary: projects.summary, fandom: projects.fandom })
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (!project) return { title: '作品未找到' };

  return {
    title: `${project.title} - Quillow`,
    description: project.summary || `《${project.title}》— 原著：${project.fandom}`,
  };
}

export default async function StoryPage({ params }: Props) {
  const session = await getAuthSession();
  const userId = (session!.user as any).id;
  const { id } = await params;

  const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

  if (!row) notFound();

  const project = row as unknown as Project;

  if (project.userId !== userId && !project.isPublished) notFound();

  const [author] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, project.userId))
    .limit(1);

  const authorName = author?.name || author?.email?.split('@')[0] || '未知作者';

  const historyOutlines = (await db
    .select()
    .from(outlines)
    .where(eq(outlines.projectId, id))
    .orderBy(desc(outlines.createdAt))) as OutlineRecord[];

  const activeOutlineId = project.activeOutlineId || historyOutlines[0]?.id || null;
  const activeOutline = historyOutlines.find((o) => o.id === activeOutlineId) || null;

  const drafts = activeOutlineId
    ? ((await db
        .select()
        .from(sceneDrafts)
        .where(eq(sceneDrafts.outlineId, activeOutlineId))) as SceneDraft[])
    : [];

  const interactionState = await getInteractionState(id);

  const currentUserName = session?.user?.name || session?.user?.email?.split('@')[0] || '用户';

  return (
    <div className="min-h-screen bg-academia-bg text-academia-parchment font-sans selection:bg-academia-gold/20">
      <AppHeader
        username={currentUserName}
        breadcrumbs={[
          { label: '作品广场', href: '/discover' },
          { label: project.title },
        ]}
      />

      <main className="w-full max-w-3xl mx-auto p-6">
        <StoryReader
          project={project}
          outline={activeOutline}
          drafts={drafts}
          authorName={authorName}
          authorId={project.userId}
          interactionState={interactionState}
        />
      </main>
    </div>
  );
}
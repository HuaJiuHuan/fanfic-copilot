import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects } from '@/lib/db-schema';
import { eq } from 'drizzle-orm';

export async function getUserIdOrThrow(): Promise<string> {
  const session = await getAuthSession();
  const userId = (session?.user as any)?.id;
  if (!userId) throw new Error('Unauthorized');
  return userId;
}

export async function verifyProjectOwnership(projectId: string, userId: string): Promise<boolean> {
  const [project] = await db
    .select({ userId: projects.userId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  return project?.userId === userId;
}

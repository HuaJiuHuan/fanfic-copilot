import type { StoryOutline } from '@/lib/schema';
import type {
  outlines,
  projects,
  sceneDrafts,
  kudos,
  comments,
  subscriptions,
  readingHistory,
  notifications,
} from '@/lib/db-schema';

export type { StoryOutline };

export type Project = Omit<typeof projects.$inferSelect, 'tags'> & {
  tags: string | null;
};

export type OutlineRecord = Omit<typeof outlines.$inferSelect, 'content'> & {
  content: StoryOutline;
};

export type SceneDraft = typeof sceneDrafts.$inferSelect;

export type Kudos = typeof kudos.$inferSelect;

export type Comment = typeof comments.$inferSelect;

export type CommentWithUser = Comment & {
  userName: string | null;
  replies: CommentWithUser[];
};

export type Subscription = typeof subscriptions.$inferSelect;

export type ReadingHistory = typeof readingHistory.$inferSelect;

export type Notification = typeof notifications.$inferSelect;

export interface NotificationWithActor extends Notification {
  actorName: string | null;
}

export type Scene = StoryOutline['acts'][number]['scenes'][number];

export type Act = StoryOutline['acts'][number];

export interface TagsData {
  preset: string[];
  free: string[];
}

export interface InteractionState {
  kudosCount: number;
  isKudosed: boolean;
  commentCount: number;
  subscriptionCount: number;
  isSubscribed: boolean;
}
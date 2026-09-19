import type { StoryOutline } from '@/lib/schema';
import type {
  outlines,
  projects,
  sceneDrafts,
  kudos,
  comments,
  bookmarks,
  subscriptions,
  readingHistory,
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

export type Bookmark = typeof bookmarks.$inferSelect;

export type Subscription = typeof subscriptions.$inferSelect;

export type ReadingHistory = typeof readingHistory.$inferSelect;

export type Scene = StoryOutline['acts'][number]['scenes'][number];

export type Act = StoryOutline['acts'][number];

export interface TagsData {
  preset: string[];
  free: string[];
}

export interface InteractionState {
  kudosCount: number;
  isKudosed: boolean;
  bookmarkCount: number;
  isBookmarked: boolean;
  commentCount: number;
}
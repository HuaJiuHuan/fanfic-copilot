import type { StoryOutline } from '@/lib/validators/story-outline';
import type {
  outlines,
  projects,
  sceneDrafts,
  kudos,
  comments,
  subscriptions,
  readingHistory,
  notifications,
} from '@/lib/db/schema';

export type { StoryOutline };

export type Project = Omit<typeof projects.$inferSelect, 'tags' | 'characterProfiles'> & {
  tags: string | null;
  characterProfiles: CharacterProfile[];
};

export interface CharacterProfile {
  name: string;
  voice: string;
  bio: string;
  relationships: string;
  coreMotivation: string;
  voiceCorpus?: VoiceCorpusSample[];
}

export interface VoiceCorpusSample {
  id: string;
  scenario: string;
  scenarioLabel?: string;
  axis?: string;
  hypothesis?: string;
  lines: CorpusLine[];
  source: CorpusSource;
  userNote?: string;
  rejectedSummary?: string;
  createdAt: string;
}

export interface CorpusLine {
  speaker: string;
  text: string;
}

export type CorpusSource =
  | 'manual'
  | 'script_extract'
  | 'scene'
  | 'chat'
  | 'interview'
  | 'preference'
  | 'import';

export type StrategyMode = 'anchored' | 'soft' | 'advise_only';

export const SOURCE_WEIGHTS: Record<CorpusSource, number> = {
  manual: 1.0,
  script_extract: 0.95,
  scene: 0.72,
  chat: 0.68,
  interview: 0.55,
  preference: 0.50,
  import: 0.40,
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
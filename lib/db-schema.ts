import { sqliteTable, text, integer, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
  'users',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull(),
    name: text('name'),
    emailVerified: integer('email_verified', { mode: 'timestamp' }),
    image: text('image'),
    password: text('password').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      emailUniqueIdx: uniqueIndex('email_unique_idx').on(table.email),
    };
  },
);

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionToken: text('session_token').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expires: integer('expires', { mode: 'timestamp' }).notNull(),
  },
  (table) => {
    return {
      sessionTokenUniqueIdx: uniqueIndex('session_token_unique_idx').on(table.sessionToken),
    };
  },
);

export const accounts = sqliteTable(
  'accounts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: integer('expires_at'),
    tokenType: text('token_type'),
    scope: text('scope'),
    idToken: text('id_token'),
    sessionState: text('session_state'),
  },
  (table) => {
    return {
      providerAccountIdUniqueIdx: uniqueIndex('provider_account_id_unique_idx').on(
        table.provider,
        table.providerAccountId,
      ),
    };
  },
);

export const verificationTokens = sqliteTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: integer('expires', { mode: 'timestamp' }).notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.identifier, table.token] }),
    };
  },
);

export const projects = sqliteTable('projects', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  fandom: text('fandom').notNull(),
  characters: text('characters').notNull(),
  premise: text('premise').notNull(),
  activeOutlineId: text('active_outline_id'),
  isPublished: integer('is_published', { mode: 'boolean' }).default(false),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  summary: text('summary').default(''),
  tags: text('tags', { mode: 'json' }),
  hits: integer('hits').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const outlines = sqliteTable('outlines', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  content: text('content', { mode: 'json' }).notNull(),
  version: integer('version').default(1),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const sceneDrafts = sqliteTable('scene_drafts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  outlineId: text('outline_id')
    .notNull()
    .references(() => outlines.id, { onDelete: 'cascade' }),
  sceneId: text('scene_id').notNull(),
  content: text('content').notNull(),
  wordCount: integer('word_count').default(0),
  isLocked: integer('is_locked', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ─── 读者互动表 ───

export const kudos = sqliteTable(
  'kudos',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      userProjectUnique: uniqueIndex('kudos_user_project_unique').on(table.userId, table.projectId),
    };
  },
);

export const comments = sqliteTable('comments', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  parentId: text('parent_id'),
  content: text('content').notNull(),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const bookmarks = sqliteTable(
  'bookmarks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    isPrivate: integer('is_private', { mode: 'boolean' }).default(false),
    note: text('note').default(''),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      userProjectUnique: uniqueIndex('bookmarks_user_project_unique').on(table.userId, table.projectId),
    };
  },
);

export const subscriptions = sqliteTable(
  'subscriptions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      userTargetUnique: uniqueIndex('subscriptions_user_target_unique').on(
        table.userId,
        table.targetType,
        table.targetId,
      ),
    };
  },
);

export const readingHistory = sqliteTable(
  'reading_history',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    lastReadAt: integer('last_read_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      userProjectUnique: uniqueIndex('reading_history_user_project_unique').on(
        table.userId,
        table.projectId,
      ),
    };
  },
);

// ─── Mastra 内部表 (由 @mastra/libsql 自动管理，此处仅声明以避免 drizzle-kit push 误删) ───

export const mastraThreads = sqliteTable('mastra_threads', {
  id: text('id').primaryKey(),
  resourceId: text('resourceId').notNull(),
  title: text('title').notNull(),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const mastraMessages = sqliteTable('mastra_messages', {
  id: text('id').primaryKey(),
  thread_id: text('thread_id').notNull(),
  content: text('content').notNull(),
  role: text('role').notNull(),
  type: text('type').notNull(),
  createdAt: text('createdAt').notNull(),
  resourceId: text('resourceId'),
});

export const mastraResources = sqliteTable('mastra_resources', {
  id: text('id').primaryKey(),
  workingMemory: text('workingMemory'),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});
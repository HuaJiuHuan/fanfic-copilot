import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// 1. 明确告诉 Drizzle CLI 去读取 Next.js 专属的 .env.local 文件
config({ path: '.env.local' });

export default defineConfig({
  schema: './lib/db-schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
  tablesFilter: [
    'users',
    'sessions',
    'accounts',
    'verification_tokens',
    'projects',
    'outlines',
    'scene_drafts',
    'kudos',
    'comments',
    'bookmarks',
    'subscriptions',
    'reading_history',
    'notifications',
  ],
});
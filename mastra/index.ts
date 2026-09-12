import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { createClient } from '@libsql/client';
import { writingAgent } from './agents/writing-agent';
import { editorAgent } from './agents/editor-agent';
import { settingAgent } from './agents/setting-agent';
import { fullImportWorkflow } from './workflows/full-import';

const mastraStorageUrl = process.env.TURSO_DATABASE_URL || 'file:./mastra/mastra.db';
const mastraStorageAuthToken = process.env.TURSO_AUTH_TOKEN;

const storage = process.env.TURSO_DATABASE_URL
  ? new LibSQLStore({
      id: 'fanfic-mastra-storage',
      url: mastraStorageUrl,
      authToken: mastraStorageAuthToken,
    })
  : new LibSQLStore({
      id: 'fanfic-mastra-storage',
      url: mastraStorageUrl,
    });

export const mastra = new Mastra({
  agents: { writingAgent, editorAgent, settingAgent },
  workflows: { fullImportWorkflow },
  storage,
});

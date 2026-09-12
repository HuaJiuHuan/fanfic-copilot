# Fanfic Copilot

基于 DeepSeek 的 AI 同人小说写作工具，三级 Agent 串行协作完成从大纲到正文的生成。

## 快速开始

```bash
npm install
cp .env.example .env.local
npx drizzle-kit push
npm dev
```

## 技术栈

Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + Turso/SQLite + Drizzle ORM + Mastra + Zustand + Zod

## 项目结构

```
fanfic/
├── app/
│   ├── actions/          # Server Actions
│   ├── api/              # SSE 流式端点
│   └── project/[id]/     # 工作台页面
├── components/           # 共享组件（ErrorBoundary 等）
├── mastra/
│   ├── agents/           # Setting / Writing / Editor Agent
│   ├── tools/            # Agent 可调用工具
│   └── workflows/        # 导入工作流
├── lib/
│   ├── repositories/     # 数据访问层
│   ├── db-schema.ts      # 表结构
│   ├── workspace-store.ts
│   ├── stream-buffer.ts
│   └── generate-phase-machine.ts
└── package.json
```

## License

MIT

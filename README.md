# Fanfic Copilot

AI 同人小说智能写作平台。基于 DeepSeek 大语言模型，三级 Agent 串行协作，从大纲推演到场景执笔，AI 全程辅助你的创作之旅。

## 快速开始

```bash
npm install
cp .env.example .env.local   # 填写 DeepSeek API Key、Turso 数据库、AUTH_SECRET
npx drizzle-kit push
npm run dev
```

## 技术栈

Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + Turso/SQLite + Drizzle ORM + Mastra + Zustand + Zod

## 三级 Agent 架构

1. **Setting Agent** — 管理项目设定，确保世界观一致性
2. **Writing Agent** — 执笔生成场景正文
3. **Editor Agent** — 审查内容，提供质量反馈

## 项目结构

```
fanfic-copilot/
├── app/
│   ├── actions/          # Server Actions
│   ├── api/              # SSE 流式端点
│   └── project/[id]/     # 工作台页面
├── components/           # 共享组件
├── mastra/
│   ├── agents/           # Setting / Writing / Editor Agent
│   ├── tools/            # Agent 可调用工具
│   └── workflows/        # 导入工作流
├── lib/
│   ├── repositories/     # 数据访问层
│   ├── services/         # 业务逻辑层
│   ├── stores/           # Zustand 状态管理
│   ├── db-schema.ts      # 表结构
│   └── stream-buffer.ts  # SSE 流缓冲
└── package.json
```

## License

MIT
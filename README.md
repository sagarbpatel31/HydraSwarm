# HydraSwarm Frontend

Frontend scaffold for the HydraSwarm dashboard described in the uploaded build plan.

## Included files

- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `components/TaskInput.tsx`
- `components/AgentPipeline.tsx`
- `components/ArtifactTabs.tsx`
- `components/MemoryPanel.tsx`
- `components/GraphPanel.tsx`
- `components/ReplayTimeline.tsx`
- `components/SectionCard.tsx`
- `lib/types.ts`
- `lib/api.ts`
- `lib/utils.ts`
- Tailwind / TypeScript / Next config files
- `.env.example`

## Install

```bash
npm install
npm run dev
```

## HydraDB environment setup

Copy `.env.example` to `.env.local`.

```bash
cp .env.example .env.local
```

Set the following values:

```env
HYDRADB_API_KEY=...
HYDRADB_TENANT_ID=hydraswarm
HYDRADB_SUBTENANT_ID=billing-team-demo
LLM_PROVIDER=openai
OPENAI_API_KEY=...
```

## Backend integration contract

This frontend expects these routes:

- `POST /api/seed`
- `POST /api/tasks/run`
- `GET /api/memory/lessons`
- `GET /api/graph/[taskId]`
- `GET /api/health`

Example response shape from `POST /api/tasks/run`:

```ts
{
  task: {
    taskId: "task-001",
    title: "Add rate limiting and audit logs to the billing API",
    description: "...",
    project: "billing-api",
    similarityKey: "rate-limiting-billing-api",
    runNumber: 1,
  },
  artifacts: [],
  lessons: [],
  decision: {},
  graph: { nodes: [], edges: [] },
  replay: [],
  recalledMemory: []
}
```

## Suggested HydraDB wrapper for backend

Create `lib/hydra.ts` in the full app repo:

```ts
import { HydraDBClient } from "@hydra_db/node";

export const hydra = new HydraDBClient({
  token: process.env.HYDRADB_API_KEY!,
});

export async function ensureTenant() {
  // create or verify hydraswarm tenant/subtenant here
}
```

Recommended metadata on every stored artifact:

- `task_id`
- `project`
- `team`
- `artifact_type`
- `agent_role`
- `status`
- `similarity_key`
- `run_number`
- `severity`
- `timestamp`

## Demo flow

1. Seed data.
2. Run Task A.
3. Show lesson extraction.
4. Run Task B.
5. Show improved recall and decision path.

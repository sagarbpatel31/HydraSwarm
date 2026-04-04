# HydraSwarm

**Self-improving multi-agent software company powered by HydraDB institutional memory.**

HydraSwarm simulates an AI software company where 7 role-based agents collaborate on engineering tasks. The system learns from past runs — Task 2 is visibly better because Task 1 changed the company's memory.

## The Agents

| Agent | Role | Produces |
|-------|------|----------|
| Priya | Product Manager | PRD with acceptance criteria |
| Alex | Architect | Technical design with tradeoffs |
| Dana | Developer | Implementation plan with pseudocode |
| Riley | Reviewer | Code review with issues and severity |
| Quinn | QA Engineer | Test plan with edge cases |
| Sam | SRE | Runbook with rollback plan |
| Casey | CTO | Final approve/revise/reject decision |

## How It Works

1. User submits a task (e.g., "Add rate limiting to the billing API")
2. Each agent **recalls** relevant knowledge, role memory, and shared lessons from HydraDB
3. Each agent **generates** its artifact using the LLM + recalled context
4. Each artifact is **stored** back to HydraDB
5. After the CTO decides, **lessons are extracted** and stored as shared memory
6. On the next similar task, agents recall those lessons and produce better outputs

## Tech Stack

- **Framework**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Memory**: [HydraDB](https://hydradb.com) (`@hydra_db/node`)
- **LLM**: OpenAI GPT-4o-mini
- **Validation**: Zod
- **Testing**: Jest + ts-jest

## Getting Started

```bash
# Clone and install
git clone https://github.com/sagarbpatel31/HydraSwarm.git
cd HydraSwarm
npm install

# Configure environment
cp .env.example .env.local
# Fill in HYDRADB_API_KEY and OPENAI_API_KEY

# Start dev server
npm run dev

# Seed HydraDB with demo data
curl -X POST http://localhost:3000/api/seed

# Run a task
curl -X POST http://localhost:3000/api/runs \
  -H "Content-Type: application/json" \
  -d '{"taskDescription": "Add rate limiting and audit logs to the billing API"}'
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `HYDRADB_API_KEY` | Yes | HydraDB API key |
| `OPENAI_API_KEY` | Yes (when MOCK_MODE=false) | OpenAI API key |
| `MOCK_MODE` | No | `true` for mock responses (default), `false` for real LLM |

## API Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/api/health` | GET | Health check (HydraDB connectivity) |
| `/api/seed` | POST | Seed demo knowledge, memories, and lessons |
| `/api/agents` | GET | List all 7 agent definitions |
| `/api/runs` | POST | Start a new task run |
| `/api/runs` | GET | List all runs |
| `/api/runs/[runId]` | GET | Get full run with all artifacts |
| `/api/runs/[runId]/stream` | GET | SSE stream of live agent progress |
| `/api/lessons` | GET | List all extracted lessons |
| `/api/memory/search` | POST | Search HydraDB knowledge/memory |
| `/api/memory/graph` | GET | Task lineage graph (nodes + edges) |
| `/api/artifacts/[id]` | GET | Get a single artifact |

## Project Structure

```
src/
  app/api/          # Next.js route handlers (10 endpoints)
  lib/
    hydra.ts        # HydraDB wrapper (recall, store, graph)
    llm.ts          # OpenAI GPT-4o-mini wrapper
    config.ts       # Environment config
    agents/         # Agent registry (7 agents)
    workflow/       # Orchestrator + evaluator
    prompts/        # Role-specific prompt templates
    mock/           # Deterministic mock responses
    seed/           # Demo data (5 knowledge docs, 14 agent memories, 3 shared lessons)
  types/            # TypeScript interfaces
  __tests__/        # Unit tests (164 tests)
```

## Testing

```bash
npm test              # Run all 164 tests
npm run test:coverage # Run with coverage report
```

## HydraDB Data Model

- **Tenant**: `hydraswarm`
- **Sub-tenants**: `agent-pm`, `agent-architect`, ..., `agent-cto`, `shared`
- **Knowledge**: Uploaded as files (specs, postmortems, runbooks)
- **Agent Memory**: Role-specific lessons per sub-tenant
- **Shared Memory**: Organizational lessons accessible to all agents
- **Graph**: Entity relations extracted from knowledge for visualization

## Demo Script

1. Click **Seed Demo Data** to populate HydraDB
2. Run **Task A**: "Add rate limiting and audit logs to the billing API"
3. Watch 7 agents process sequentially with live SSE updates
4. Check the **Lessons panel** — new lessons stored from Task A
5. Run **Task B**: "Add rate limiting and audit logging to invoice endpoints"
6. Observe agents recalling Task A's lessons and producing better outputs
7. Compare scores — the company got smarter because its memory changed

## Team

- **Backend/Orchestration**: HydraDB, workflow engine, agents, prompts, API routes
- **Frontend/Visualization**: Dashboard UI, agent cards, artifact tabs, timeline, graph

---

Built for a 24-hour hackathon.

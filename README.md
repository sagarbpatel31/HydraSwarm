# HydraSwarm

**Self-improving multi-agent AI software company powered by HydraDB institutional memory.**

> 7 agents. 1 shared brain. Every run makes the next one smarter.

HydraSwarm simulates a software engineering company where 7 specialized AI agents collaborate on tasks. Unlike one-shot AI tools, HydraSwarm **remembers and improves** — every task writes new knowledge back to HydraDB, and the next similar task produces a measurably better result.

## Why This Matters

Most AI systems generate once and forget. HydraSwarm demonstrates **institutional learning**:

- **Run 1**: Agents find issues (synchronous processing, missing circuit breakers) → Score 7/10
- **Run 2**: Agents recall Run 1's lessons, fix the issues proactively → Score 8/10
- **Run 3**: Further refinements from accumulated memory → Score 9/10

The improvement is provable — the Compare Runs view shows it side-by-side.

## The Agents

| # | Agent | Emoji | Role | Produces |
|---|-------|-------|------|----------|
| 1 | Priya | 📋 | Product Manager | PRD with acceptance criteria |
| 2 | Alex | 🏗️ | Architect | Technical design with tradeoffs |
| 3 | Dana | 💻 | Developer | Implementation plan with pseudocode |
| 4 | Riley | 🔍 | Reviewer | Code review with severity ratings |
| 5 | Quinn | 🧪 | QA Engineer | Test plan with edge cases |
| 6 | Sam | 🛡️ | SRE | Runbook with rollback plan |
| 7 | Casey | 👔 | CTO | Final approve/revise/reject decision |

## How It Works

```
User submits a task (e.g., "Build a notification system")
       ↓
Each agent (PM → Architect → Developer → Reviewer → QA → SRE → CTO):
  1. RECALL — Queries HydraDB for relevant knowledge + agent memory + shared lessons
  2. GENERATE — Produces output using LLM with recalled context
  3. STORE — Saves artifact back to HydraDB
       ↓
Evaluator extracts lessons from the run → Stores to HydraDB shared memory
       ↓
Next run recalls those lessons → Produces better output
```

## Key Features

- **Live Agent Thinking Log** — Dark terminal console showing every HydraDB query and storage operation in real-time
- **SSE Streaming** — Watch agents activate one by one with live status updates (recalling → generating → storing → done)
- **Run Comparison** — Side-by-side view showing score delta, recalled context diff, and "Improved" badges
- **HydraDB Memory Explorer** — Browse all institutional memory with search, relevance scores, and per-agent filtering
- **Progressive Scoring** — CTO score visibly improves across runs (7→8→9) as lessons accumulate
- **Markdown Rendering** — All agent outputs rendered with proper headings, tables, code blocks
- **326 Unit Tests** — Full coverage across 21 suites (backend + frontend + API + streaming)

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 16 (App Router) + TypeScript | Full-stack in one repo, SSE support |
| Styling | Tailwind CSS v4 | Gradient backgrounds, glass-effect cards |
| Memory | [HydraDB](https://hydradb.com) (`@hydra_db/node`) | Semantic search, graph relations, multi-tenant memory |
| LLM | OpenAI GPT-4o-mini | Fast, cheap (~$0.005/run), good quality |
| Graph | React Flow | Task lineage visualization |
| Validation | Zod | API input validation |
| Testing | Jest + ts-jest + Testing Library | 326 tests across backend and frontend |

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
# Open http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `HYDRADB_API_KEY` | Yes | HydraDB API key from [hydradb.com](https://hydradb.com) |
| `OPENAI_API_KEY` | When MOCK_MODE=false | OpenAI API key from [platform.openai.com](https://platform.openai.com) |
| `MOCK_MODE` | No | `true` (default) for mock responses, `false` for real LLM |

## API Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/api/health` | GET | Health check — HydraDB connectivity + mock mode status |
| `/api/seed` | POST | Seed 5 knowledge docs, 14 agent memories, 3 shared lessons |
| `/api/agents` | GET | List all 7 agent definitions |
| `/api/runs` | POST | Start a new 7-agent pipeline run |
| `/api/runs` | GET | List all completed runs |
| `/api/runs/[runId]` | GET | Full run with all artifacts and evaluation |
| `/api/runs/[runId]/stream` | GET | SSE stream of live agent progress |
| `/api/lessons` | GET | All extracted lessons across runs |
| `/api/memory/search` | POST | Search HydraDB (knowledge, agent, shared) |
| `/api/memory/explore` | GET | Browse all memory with stats |
| `/api/memory/graph` | GET | Task lineage graph for React Flow |
| `/api/artifacts/[id]` | GET | Single artifact by ID |

## Project Structure

```
src/
  app/
    page.tsx                    # Main dashboard (SSE, tabs, run history)
    api/                        # 12 API route handlers
  components/
    AgentPipeline.tsx           # 7 agent cards with progress bar
    ArtifactTabs.tsx            # Horizontal role tabs + markdown content
    ThinkingLog.tsx             # Real-time terminal console
    MemoryPanel.tsx             # Grouped recalled context with expand
    MemoryExplorer.tsx          # Full HydraDB browser with search
    GraphPanel.tsx              # React Flow task lineage
    ReplayTimeline.tsx          # Stage timing with recall counts
    RunComparison.tsx           # Side-by-side run diff
    SectionCard.tsx             # Reusable glass-effect card
    TaskInput.tsx               # Task form with 3 presets
  lib/
    hydra.ts                    # HydraDB wrapper (340 lines)
    llm.ts                      # OpenAI GPT-4o-mini wrapper
    stream.ts                   # SSE EventSource client
    api.ts                      # Frontend API client + data transforms
    config.ts                   # Environment configuration
    utils.ts                    # UI utilities (cn, roleLabel, statusClasses)
    frontend-types.ts           # Frontend display types
    agents/registry.ts          # 7 agent definitions
    workflow/orchestrator.ts    # Pipeline engine with SSE pub/sub
    workflow/evaluator.ts       # Lesson extraction via LLM
    prompts/system.ts           # Role-specific prompt builder
    mock/responses.ts           # Task-adaptive mock responses
    seed/                       # Demo data (knowledge, memories, lessons)
  types/run.ts                  # Backend type definitions
  __tests__/                    # 326 unit tests across 21 suites
```

## HydraDB Integration

HydraDB provides the institutional memory that makes learning possible:

| HydraDB Feature | How We Use It |
|-----------------|---------------|
| **Knowledge ingestion** | Upload specs, postmortems, and agent artifacts as files |
| **User memory** | Per-agent memories in isolated sub-tenants (`agent-pm`, `agent-architect`, etc.) |
| **Shared memory** | Organization-wide lessons in `shared` sub-tenant |
| **Full recall** | Hybrid semantic + keyword search with `alpha=0.7`, `recency_bias=0.3` |
| **Preference recall** | Role-specific memory retrieval per sub-tenant |
| **Graph relations** | Entity-relationship extraction for task lineage visualization |
| **Inference** | `infer: true` extracts implicit insights from stored memories |

All HydraDB operations go through a single wrapper (`lib/hydra.ts`) — the rest of the app never touches the SDK directly.

## Testing

```bash
npm test              # Run all 326 tests
npm run test:coverage # Run with coverage report
```

| Category | Suites | Tests | Coverage |
|----------|--------|-------|----------|
| Backend (config, hydra, orchestrator, evaluator, prompts, seed, llm, registry, mock) | 9 | 164 | Core business logic |
| Frontend Components (10 components) | 9 | 119 | All UI rendering + interactions |
| Frontend Utils (api, utils, stream) | 3 | 43 | API transforms, SSE, utilities |
| **Total** | **21** | **326** | |

## Demo Script

1. Open the app → Click **Seed demo data**
2. Click **🔔 Task A: Notifications** → Click **Run HydraSwarm**
3. Watch the **Thinking Log** — see HydraDB queries and LLM calls in real-time
4. Check **Artifacts** tab → Read PM, Architect, Reviewer outputs
5. Check **Evaluation** tab → Score 7/10, 3 lessons extracted
6. Click **🔔 Task B: Improve It** → Run again
7. Watch Thinking Log → More items recalled from HydraDB
8. Check Evaluation → Score 8/10, reviewer now APPROVES
9. Click **Compare Runs** → See side-by-side improvement proof
10. Click **Memory Explorer** → Browse the full HydraDB brain

**The punchline**: "The company got smarter because its memory changed. That's HydraDB."

## Cost

| Mode | Cost per run | Notes |
|------|-------------|-------|
| Mock mode | Free | Pre-written responses, real HydraDB storage |
| Real LLM | ~$0.005 | GPT-4o-mini, 7 sequential calls |
| Full demo (10 runs) | ~$0.05 | Under 5 cents total |

---

Built for HydraDB hackathon. [Sagar Patel](https://github.com/sagarbpatel31) + Gayatri Patil.

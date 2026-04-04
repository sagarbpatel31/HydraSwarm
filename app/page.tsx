"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { TaskInput } from "@/components/TaskInput";
import { AgentPipeline } from "@/components/AgentPipeline";
import { ArtifactTabs } from "@/components/ArtifactTabs";
import { MemoryPanel } from "@/components/MemoryPanel";
import { GraphPanel } from "@/components/GraphPanel";
import { ReplayTimeline } from "@/components/ReplayTimeline";
import { SectionCard } from "@/components/SectionCard";
import { seedDemo, runTask } from "@/lib/api";
import type { PipelineStage, RunResult } from "@/lib/types";

const stageOrder: PipelineStage[] = [
  { role: "pm", label: "Scope and acceptance", status: "idle" },
  { role: "architect", label: "Design and trade-offs", status: "idle" },
  { role: "developer", label: "Implementation plan", status: "idle" },
  { role: "reviewer", label: "Defect and safety review", status: "idle" },
  { role: "qa", label: "Test design and regressions", status: "idle" },
  { role: "sre", label: "Operational risk evaluation", status: "idle" },
  { role: "cto", label: "Final decision", status: "idle" },
];

export default function HomePage() {
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stages = useMemo(() => {
    if (!runResult?.replay?.length) return stageOrder;

    return stageOrder.map((stage) => {
      const replay = runResult.replay?.find((item) => item.role === stage.role);
      if (!replay) return stage;
      return {
        ...stage,
        status: replay.status,
        summary: replay.summary,
        elapsedMs:
          new Date(replay.finishedAt).getTime() - new Date(replay.startedAt).getTime(),
      };
    });
  }, [runResult]);

  const onSeed = async () => {
    setSeeding(true);
    setError(null);
    setMessage(null);
    try {
      const result = await seedDemo();
      setMessage(result.message || "Demo data seeded successfully.");
    } catch (seedError) {
      setError(seedError instanceof Error ? seedError.message : "Failed to seed demo data.");
    } finally {
      setSeeding(false);
    }
  };

  const onRun = async (payload: { title: string; description: string; project: string }) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await runTask(payload);
      setRunResult(result);
      setMessage(`Run completed for ${result.task.title}.`);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Task execution failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-accent-900 p-8 text-white shadow-soft">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent-200">HydraSwarm</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                AI software company simulation with institutional memory.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-200 md:text-base">
                Run a task through PM, Architect, Developer, Reviewer, QA, SRE, and CTO. Persist artifacts and lessons in HydraDB, then show why the second run gets smarter.
              </p>
            </div>
          </div>
        </header>

        <TaskInput onRun={onRun} onSeed={onSeed} onReset={() => setRunResult(null)} busy={busy} seeding={seeding} />

        {message ? (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : null}

        <AgentPipeline stages={stages} />

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <ArtifactTabs artifacts={runResult?.artifacts ?? []} />
          <MemoryPanel items={runResult?.recalledMemory ?? []} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <GraphPanel graph={runResult?.graph ?? { nodes: [], edges: [] }} />
          <ReplayTimeline events={runResult?.replay ?? []} />
        </div>

        <SectionCard title="Implementation notes" subtitle="What this frontend expects from your backend orchestrator.">
          <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Required routes</p>
              <p className="mt-2">POST /api/seed, POST /api/tasks/run, GET /api/memory/lessons, GET /api/graph/[taskId].</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Expected payload</p>
              <p className="mt-2">The run route should return task, artifacts, lessons, decision, graph, replay, and recalledMemory.</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </main>
  );
}

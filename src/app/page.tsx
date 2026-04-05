"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, GitCompareArrows, History, Brain } from "lucide-react";
import { TaskInput } from "@/components/TaskInput";
import { AgentPipeline } from "@/components/AgentPipeline";
import { ArtifactTabs } from "@/components/ArtifactTabs";
import { MemoryPanel } from "@/components/MemoryPanel";
import { GraphPanel } from "@/components/GraphPanel";
import { ReplayTimeline } from "@/components/ReplayTimeline";
import { SectionCard } from "@/components/SectionCard";
import { RunComparison } from "@/components/RunComparison";
import { MemoryExplorer } from "@/components/MemoryExplorer";
import { seedDemo, startRunOnly, fetchRunResult, mapStatus } from "@/lib/api";
import { connectToRunStream, StepUpdateData } from "@/lib/stream";
import type { AgentRole, PipelineStage, RunResult } from "@/lib/frontend-types";

const ROLES: AgentRole[] = ["pm", "architect", "developer", "reviewer", "qa", "sre", "cto"];
const ROLE_LABELS: Record<AgentRole, string> = {
  pm: "Scope and acceptance",
  architect: "Design and trade-offs",
  developer: "Implementation plan",
  reviewer: "Defect and safety review",
  qa: "Test design and regressions",
  sre: "Operational risk evaluation",
  cto: "Final decision",
};

function makeIdleStages(): PipelineStage[] {
  return ROLES.map((role) => ({
    role,
    label: ROLE_LABELS[role],
    status: "idle" as const,
  }));
}

type ViewMode = "dashboard" | "compare" | "memory";

export default function HomePage() {
  const [runHistory, setRunHistory] = useState<RunResult[]>([]);
  const [currentResult, setCurrentResult] = useState<RunResult | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>(makeIdleStages());
  const [busy, setBusy] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const cleanupRef = useRef<(() => void) | null>(null);

  const onSeed = async () => {
    setSeeding(true);
    setError(null);
    setMessage(null);
    try {
      const result = await seedDemo();
      setMessage(result.message || "Demo data seeded successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to seed.");
    } finally {
      setSeeding(false);
    }
  };

  const handleStepUpdate = useCallback((step: StepUpdateData) => {
    setStages((prev) =>
      prev.map((s) => {
        if (s.role !== step.agentRole) return s;
        const mapped = mapStatus(step.status);
        return {
          ...s,
          status: mapped,
          summary:
            step.status === "recalling"
              ? "Recalling institutional memory..."
              : step.status === "generating"
                ? "Generating with LLM..."
                : step.status === "storing"
                  ? "Storing to HydraDB..."
                  : step.artifact?.content?.slice(0, 120) ?? s.summary,
          elapsedMs: step.durationMs ?? s.elapsedMs,
        };
      })
    );
  }, []);

  const onRun = async (payload: { title: string; description: string; project: string }) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    setCurrentResult(null);
    setStages(makeIdleStages());

    try {
      // Start the run
      const runId = await startRunOnly(payload);

      // Connect SSE for live updates
      const cleanup = connectToRunStream(
        runId,
        async (event) => {
          if (event.type === "step_update") {
            handleStepUpdate(event.data as StepUpdateData);
          }
          if (event.type === "run_complete") {
            // Fetch full result and update state
            try {
              const result = await fetchRunResult(runId);
              setCurrentResult(result);
              setRunHistory((prev) => [...prev, result]);
              setMessage(
                `Run #${result.task.runNumber} completed — "${result.task.title}"`
              );

              // Update stages one final time from full result
              if (result.replay) {
                setStages((prev) =>
                  prev.map((s) => {
                    const replay = result.replay?.find((r) => r.role === s.role);
                    if (!replay) return s;
                    return {
                      ...s,
                      status: replay.status,
                      summary: replay.summary?.slice(0, 120),
                      elapsedMs:
                        new Date(replay.finishedAt).getTime() -
                        new Date(replay.startedAt).getTime(),
                    };
                  })
                );
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to fetch results.");
            }
            setBusy(false);
          }
          if (event.type === "error") {
            setError("Run encountered an error.");
            setBusy(false);
          }
        },
        (err) => {
          // SSE error — fall back to polling
          console.warn("SSE error, falling back:", err);
          pollForCompletion(runId);
        }
      );

      cleanupRef.current = cleanup;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start run.");
      setBusy(false);
    }
  };

  // Fallback polling if SSE fails
  const pollForCompletion = async (runId: string) => {
    const timeout = 180_000;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const result = await fetchRunResult(runId);
        if (result.task.taskId) {
          setCurrentResult(result);
          setRunHistory((prev) => [...prev, result]);
          setMessage(`Run completed — "${result.task.title}"`);
          if (result.replay) {
            setStages(
              makeIdleStages().map((s) => {
                const replay = result.replay?.find((r) => r.role === s.role);
                if (!replay) return s;
                return { ...s, status: replay.status, summary: replay.summary?.slice(0, 120), elapsedMs: new Date(replay.finishedAt).getTime() - new Date(replay.startedAt).getTime() };
              })
            );
          }
          setBusy(false);
          return;
        }
      } catch {
        // keep polling
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    setError("Run timed out.");
    setBusy(false);
  };

  const onReset = () => {
    cleanupRef.current?.();
    setCurrentResult(null);
    setStages(makeIdleStages());
    setMessage(null);
    setError(null);
  };

  const latestResult = currentResult ?? runHistory[runHistory.length - 1] ?? null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Header */}
        <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-accent-900 p-8 text-white shadow-soft">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(56,116,255,0.15),_transparent_50%)]" />
          <div className="relative">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent-200">
              HydraSwarm
            </p>
            <div className="mt-3 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  AI software company simulation with institutional memory.
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-200 md:text-base">
                  Run a task through 7 specialized agents. Every artifact and lesson is persisted
                  in HydraDB. The second run gets smarter because the first changed the company&apos;s memory.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {runHistory.length > 0 && (
                  <div className="rounded-2xl bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
                    <span className="font-semibold">{runHistory.length}</span> run{runHistory.length !== 1 ? "s" : ""} completed
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Navigation tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("dashboard")}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
              viewMode === "dashboard"
                ? "bg-accent-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:border-accent-300"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setViewMode("compare")}
            disabled={runHistory.length < 2}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
              viewMode === "compare"
                ? "bg-accent-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:border-accent-300 disabled:opacity-40"
            }`}
          >
            <GitCompareArrows className="h-4 w-4" />
            Compare Runs
            {runHistory.length >= 2 && (
              <span className="rounded-full bg-accent-100 text-accent-700 px-1.5 py-0.5 text-xs font-bold">
                {runHistory.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setViewMode("memory")}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
              viewMode === "memory"
                ? "bg-accent-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:border-accent-300"
            }`}
          >
            <Brain className="h-4 w-4" />
            Memory Explorer
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {message}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Dashboard view */}
        {viewMode === "dashboard" && (
          <>
            <TaskInput onRun={onRun} onSeed={onSeed} onReset={onReset} busy={busy} seeding={seeding} />

            <AgentPipeline stages={stages} />

            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
              <ArtifactTabs artifacts={[...(latestResult?.artifacts ?? []), ...(latestResult?.lessons ?? [])]} />
              <MemoryPanel items={latestResult?.recalledMemory ?? []} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <GraphPanel graph={latestResult?.graph ?? { nodes: [], edges: [] }} />
              <ReplayTimeline events={latestResult?.replay ?? []} />
            </div>

            {/* Evaluation */}
            <SectionCard title="Evaluation" subtitle="CTO decision and extracted lessons.">
              {latestResult?.decision ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Run #{latestResult.task.runNumber} — Score: {latestResult.decision.content.match(/Score:\s*(\d+)/i)?.[1] ?? "N/A"}/10
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {latestResult.decision.content.match(/Decision:\s*(.+)/i)?.[1] ?? "Pending"}
                    </p>
                  </div>
                  {latestResult.lessons.length > 0 && (
                    <div className="rounded-2xl bg-emerald-50 p-4">
                      <p className="text-sm font-semibold text-emerald-900">
                        Lessons extracted ({latestResult.lessons.length})
                      </p>
                      <ul className="mt-2 space-y-1">
                        {latestResult.lessons.map((l) => (
                          <li key={l.artifactId} className="text-sm text-emerald-700">
                            <span className="font-medium">[{l.title}]</span> {l.content}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Run a task to see evaluation.</p>
              )}
            </SectionCard>

            {/* Run history */}
            {runHistory.length > 0 && (
              <SectionCard
                title="Run History"
                subtitle={`${runHistory.length} run${runHistory.length !== 1 ? "s" : ""} completed this session.`}
                actions={
                  runHistory.length >= 2 ? (
                    <button
                      onClick={() => setViewMode("compare")}
                      className="inline-flex items-center gap-2 rounded-2xl bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700"
                    >
                      <GitCompareArrows className="h-4 w-4" />
                      Compare Runs
                    </button>
                  ) : undefined
                }
              >
                <div className="space-y-2">
                  {runHistory.map((run, i) => (
                    <div
                      key={run.task.taskId}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 transition"
                      onClick={() => setCurrentResult(run)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-sm font-bold text-accent-700">
                          #{i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{run.task.title}</p>
                          <p className="text-xs text-slate-500">
                            {run.artifacts.length} artifacts, {run.lessons.length} lessons
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-700">
                          Score: {run.decision?.content.match(/Score:\s*(\d+)/i)?.[1] ?? "?"}/10
                        </p>
                        <p className="text-xs text-slate-400">
                          {run.recalledMemory?.length ?? 0} items recalled
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </>
        )}

        {/* Compare view */}
        {viewMode === "compare" && (
          <RunComparison runs={runHistory} />
        )}

        {/* Memory explorer view */}
        {viewMode === "memory" && (
          <MemoryExplorer />
        )}
      </div>
    </main>
  );
}

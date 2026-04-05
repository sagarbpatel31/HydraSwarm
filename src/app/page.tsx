"use client";

import { useCallback, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, GitCompareArrows, Brain, BarChart3, FileText, Clock, Network } from "lucide-react";
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
  return ROLES.map((role) => ({ role, label: ROLE_LABELS[role], status: "idle" as const }));
}

type TopView = "dashboard" | "compare" | "memory";
type ContentTab = "artifacts" | "memory" | "graph" | "evaluation";

export default function HomePage() {
  const [runHistory, setRunHistory] = useState<RunResult[]>([]);
  const [currentResult, setCurrentResult] = useState<RunResult | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>(makeIdleStages());
  const [busy, setBusy] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topView, setTopView] = useState<TopView>("dashboard");
  const [contentTab, setContentTab] = useState<ContentTab>("artifacts");
  const cleanupRef = useRef<(() => void) | null>(null);

  const onSeed = async () => {
    setSeeding(true); setError(null); setMessage(null);
    try {
      const result = await seedDemo();
      setMessage(result.message || "Demo data seeded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to seed.");
    } finally { setSeeding(false); }
  };

  const handleStepUpdate = useCallback((step: StepUpdateData) => {
    setStages((prev) =>
      prev.map((s) => {
        if (s.role !== step.agentRole) return s;
        return {
          ...s,
          status: mapStatus(step.status),
          summary: step.status === "recalling" ? "Recalling memory..."
            : step.status === "generating" ? "Generating with LLM..."
            : step.status === "storing" ? "Storing to HydraDB..."
            : step.artifact?.content?.slice(0, 100) ?? s.summary,
          elapsedMs: step.durationMs ?? s.elapsedMs,
        };
      })
    );
  }, []);

  const onRun = async (payload: { title: string; description: string; project: string }) => {
    setBusy(true); setError(null); setMessage(null);
    setCurrentResult(null); setStages(makeIdleStages()); setContentTab("artifacts");
    try {
      const runId = await startRunOnly(payload);
      const cleanup = connectToRunStream(runId, async (event) => {
        if (event.type === "step_update") handleStepUpdate(event.data as StepUpdateData);
        if (event.type === "run_complete") {
          try {
            const result = await fetchRunResult(runId);
            setCurrentResult(result);
            setRunHistory((prev) => [...prev, result]);
            setMessage(`Run #${result.task.runNumber} completed — "${result.task.title}"`);
            if (result.replay) {
              setStages((prev) => prev.map((s) => {
                const r = result.replay?.find((e) => e.role === s.role);
                if (!r) return s;
                return { ...s, status: r.status, summary: r.summary?.slice(0, 100),
                  elapsedMs: new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime() };
              }));
            }
          } catch (err) { setError(err instanceof Error ? err.message : "Failed to fetch results."); }
          setBusy(false);
        }
        if (event.type === "error") { setError("Run encountered an error."); setBusy(false); }
      }, () => { pollForCompletion(runId); });
      cleanupRef.current = cleanup;
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to start."); setBusy(false); }
  };

  const pollForCompletion = async (runId: string) => {
    const start = Date.now();
    while (Date.now() - start < 180_000) {
      try {
        const result = await fetchRunResult(runId);
        if (result.task.taskId) {
          setCurrentResult(result); setRunHistory((prev) => [...prev, result]);
          setMessage(`Run completed — "${result.task.title}"`);
          setBusy(false); return;
        }
      } catch { /* keep polling */ }
      await new Promise((r) => setTimeout(r, 2000));
    }
    setError("Run timed out."); setBusy(false);
  };

  const onReset = () => {
    cleanupRef.current?.();
    setCurrentResult(null); setStages(makeIdleStages());
    setMessage(null); setError(null);
  };

  const latestResult = currentResult ?? runHistory[runHistory.length - 1] ?? null;

  const contentTabs: Array<{ key: ContentTab; label: string; icon: React.ReactNode }> = [
    { key: "artifacts", label: "Artifacts", icon: <FileText className="h-4 w-4" /> },
    { key: "memory", label: "Memory", icon: <Brain className="h-4 w-4" /> },
    { key: "graph", label: "Graph & Timeline", icon: <Network className="h-4 w-4" /> },
    { key: "evaluation", label: "Evaluation", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        {/* Header */}
        <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-accent-900 px-8 py-6 text-white shadow-soft">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(56,116,255,0.15),_transparent_50%)]" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-accent-200">HydraSwarm</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
                AI software company with institutional memory
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {runHistory.length > 0 && (
                <div className="rounded-xl bg-white/10 px-3 py-1.5 text-sm backdrop-blur-sm">
                  <span className="font-bold">{runHistory.length}</span> run{runHistory.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Top navigation */}
        <div className="flex gap-2">
          {([
            { key: "dashboard", label: "Dashboard" },
            { key: "compare", label: "Compare Runs", icon: <GitCompareArrows className="h-4 w-4" />, disabled: runHistory.length < 2, badge: runHistory.length >= 2 ? runHistory.length : undefined },
            { key: "memory", label: "Memory Explorer", icon: <Brain className="h-4 w-4" /> },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTopView(tab.key)}
              disabled={"disabled" in tab ? tab.disabled : false}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition ${
                topView === tab.key
                  ? "bg-accent-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-accent-300 disabled:opacity-40"
              }`}
            >
              {"icon" in tab && tab.icon}
              {tab.label}
              {"badge" in tab && tab.badge && (
                <span className="rounded-full bg-accent-100 text-accent-700 px-1.5 py-0.5 text-xs font-bold">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Messages */}
        {message && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> {message}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* ===== DASHBOARD VIEW ===== */}
        {topView === "dashboard" && (
          <>
            <TaskInput onRun={onRun} onSeed={onSeed} onReset={onReset} busy={busy} seeding={seeding} />
            <AgentPipeline stages={stages} />

            {/* Content tabs */}
            <div className="flex gap-1 border-b border-slate-200 pb-px">
              {contentTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setContentTab(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
                    contentTab === tab.key
                      ? "border-accent-500 text-accent-700"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Content panel */}
            <div className="min-h-[400px]">
              {contentTab === "artifacts" && (
                <ArtifactTabs artifacts={[...(latestResult?.artifacts ?? []), ...(latestResult?.lessons ?? [])]} />
              )}

              {contentTab === "memory" && (
                <MemoryPanel items={latestResult?.recalledMemory ?? []} />
              )}

              {contentTab === "graph" && (
                <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                  <GraphPanel graph={latestResult?.graph ?? { nodes: [], edges: [] }} />
                  <ReplayTimeline events={latestResult?.replay ?? []} />
                </div>
              )}

              {contentTab === "evaluation" && (
                <div className="space-y-5">
                  {/* Evaluation */}
                  <SectionCard title="CTO Evaluation" subtitle="Final decision and score.">
                    {latestResult?.decision ? (
                      <div className="grid gap-4 md:grid-cols-[auto_1fr]">
                        {/* Score circle */}
                        <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-accent-50 to-white border border-accent-200 p-6 min-w-[120px]">
                          <span className="text-4xl font-bold text-accent-700">
                            {latestResult.decision.content.match(/Score:\s*(\d+)/i)?.[1] ?? "?"}
                          </span>
                          <span className="text-xs text-slate-500 mt-1">out of 10</span>
                          <span className={`mt-2 rounded-full px-3 py-1 text-xs font-semibold ${
                            latestResult.decision.content.match(/Decision:\s*APPROVED(?!\s*WITH)/i)
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {latestResult.decision.content.match(/Decision:\s*(.+)/i)?.[1]?.slice(0, 25) ?? "Pending"}
                          </span>
                          <span className="mt-1 text-[10px] text-slate-400">Run #{latestResult.task.runNumber}</span>
                        </div>
                        {/* Lessons */}
                        <div>
                          {latestResult.lessons.length > 0 && (
                            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                              <p className="text-sm font-semibold text-emerald-900 mb-2">
                                💡 Lessons extracted ({latestResult.lessons.length})
                              </p>
                              <ul className="space-y-2">
                                {latestResult.lessons.map((l) => (
                                  <li key={l.artifactId} className="text-sm text-emerald-700">
                                    <span className="font-semibold">[{l.title}]</span> {l.content}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 py-4 text-center">Run a task to see the CTO&apos;s evaluation.</p>
                    )}
                  </SectionCard>

                  {/* Run history */}
                  {runHistory.length > 0 && (
                    <SectionCard
                      title="Run History"
                      subtitle={`${runHistory.length} run${runHistory.length !== 1 ? "s" : ""} this session`}
                      actions={runHistory.length >= 2 ? (
                        <button onClick={() => setTopView("compare")}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-accent-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-700">
                          <GitCompareArrows className="h-3.5 w-3.5" /> Compare
                        </button>
                      ) : undefined}
                    >
                      <div className="space-y-1.5">
                        {runHistory.map((run, i) => (
                          <div key={run.task.taskId}
                            className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition ${
                              currentResult?.task.taskId === run.task.taskId ? "border-accent-300 bg-accent-50" : "border-slate-100 hover:bg-slate-50"
                            }`}
                            onClick={() => setCurrentResult(run)}>
                            <div className="flex items-center gap-2.5">
                              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                currentResult?.task.taskId === run.task.taskId ? "bg-accent-600 text-white" : "bg-slate-200 text-slate-600"
                              }`}>#{i + 1}</span>
                              <div>
                                <p className="text-sm font-medium text-slate-800 line-clamp-1">{run.task.title}</p>
                                <p className="text-[11px] text-slate-400">{run.artifacts.length} artifacts, {run.lessons.length} lessons</p>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-slate-700">
                              {run.decision?.content.match(/Score:\s*(\d+)/i)?.[1] ?? "?"}/10
                            </span>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== COMPARE VIEW ===== */}
        {topView === "compare" && <RunComparison runs={runHistory} />}

        {/* ===== MEMORY EXPLORER VIEW ===== */}
        {topView === "memory" && <MemoryExplorer />}
      </div>
    </main>
  );
}

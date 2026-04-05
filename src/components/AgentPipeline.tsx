"use client";

import { CheckCircle2, Clock3, AlertTriangle, CircleDashed, XCircle, Loader2 } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import type { PipelineStage } from "@/lib/frontend-types";
import { formatElapsed, statusClasses } from "@/lib/utils";

const agentInfo: Record<string, { emoji: string; name: string }> = {
  pm: { emoji: "📋", name: "Priya — PM" },
  architect: { emoji: "🏗️", name: "Alex — Architect" },
  developer: { emoji: "💻", name: "Dana — Developer" },
  reviewer: { emoji: "🔍", name: "Riley — Reviewer" },
  qa: { emoji: "🧪", name: "Quinn — QA" },
  sre: { emoji: "🛡️", name: "Sam — SRE" },
  cto: { emoji: "👔", name: "Casey — CTO" },
};

function StatusIcon({ status }: { status: PipelineStage["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "running":
      return <Loader2 className="h-4 w-4 text-accent-500 animate-spin" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-rose-500" />;
    default:
      return <CircleDashed className="h-4 w-4 text-slate-300" />;
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "idle": return "Waiting";
    case "running": return "Working...";
    case "completed": return "Done";
    case "warning": return "Warning";
    case "failed": return "Failed";
    default: return status;
  }
}

export function AgentPipeline({ stages }: { stages: PipelineStage[] }) {
  const completedCount = stages.filter((s) => s.status === "completed").length;
  const isRunning = stages.some((s) => s.status === "running");

  return (
    <SectionCard
      title="Agent Pipeline"
      subtitle={
        isRunning
          ? `${completedCount}/7 agents completed — watching the AI company work...`
          : completedCount === 7
            ? "All 7 agents completed successfully."
            : "Submit a task to activate the pipeline."
      }
    >
      {/* Progress bar */}
      <div className="mb-5 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-500 to-emerald-500 transition-all duration-700 ease-out"
          style={{ width: `${(completedCount / 7) * 100}%` }}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-7 md:grid-cols-4 sm:grid-cols-2">
        {stages.map((stage, idx) => {
          const info = agentInfo[stage.role];
          const isActive = stage.status === "running";
          const isDone = stage.status === "completed";

          return (
            <div
              key={stage.role}
              className={`relative rounded-2xl border p-4 transition-all duration-300 ${
                isActive
                  ? "border-accent-300 bg-accent-50/50 shadow-md agent-running"
                  : isDone
                    ? "border-emerald-200 bg-emerald-50/30"
                    : "border-slate-200 bg-white"
              }`}
            >
              {/* Step number */}
              <div className={`absolute -top-2.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                isDone ? "bg-emerald-500 text-white" : isActive ? "bg-accent-500 text-white" : "bg-slate-200 text-slate-500"
              }`}>
                {isDone ? "✓" : idx + 1}
              </div>

              {/* Agent avatar */}
              <div className="text-center">
                <span className="text-2xl">{info.emoji}</span>
                <p className="mt-1 text-xs font-semibold text-slate-800 leading-tight">{info.name}</p>
              </div>

              {/* Status */}
              <div className="mt-3 flex items-center justify-center gap-1.5">
                <StatusIcon status={stage.status} />
                <span className={`text-xs font-medium ${
                  isDone ? "text-emerald-600" : isActive ? "text-accent-600" : "text-slate-400"
                }`}>
                  {statusLabel(stage.status)}
                </span>
              </div>

              {/* Summary */}
              <p className="mt-2 text-[11px] text-slate-500 leading-snug text-center min-h-[32px] line-clamp-2">
                {stage.summary || stage.label}
              </p>

              {/* Elapsed */}
              {stage.elapsedMs !== undefined && (
                <p className="mt-2 text-center text-[10px] text-slate-400 font-mono">
                  {formatElapsed(stage.elapsedMs)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Connection arrows between cards (visible on xl) */}
      <div className="hidden xl:flex justify-between px-8 -mt-[52px] mb-6 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center">
            <div className={`w-4 h-0.5 ${
              stages[i]?.status === "completed" ? "bg-emerald-300" : "bg-slate-200"
            }`} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

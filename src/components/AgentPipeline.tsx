"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import type { PipelineStage } from "@/lib/frontend-types";
import { formatElapsed } from "@/lib/utils";

const agentInfo: Record<string, { emoji: string; name: string; gradient: string; border: string }> = {
  pm: { emoji: "📋", name: "Priya — PM", gradient: "from-sky-50 to-blue-50", border: "border-sky-200" },
  architect: { emoji: "🏗️", name: "Alex — Architect", gradient: "from-indigo-50 to-violet-50", border: "border-indigo-200" },
  developer: { emoji: "💻", name: "Dana — Developer", gradient: "from-violet-50 to-purple-50", border: "border-violet-200" },
  reviewer: { emoji: "🔍", name: "Riley — Reviewer", gradient: "from-amber-50 to-orange-50", border: "border-amber-200" },
  qa: { emoji: "🧪", name: "Quinn — QA", gradient: "from-emerald-50 to-teal-50", border: "border-emerald-200" },
  sre: { emoji: "🛡️", name: "Sam — SRE", gradient: "from-rose-50 to-pink-50", border: "border-rose-200" },
  cto: { emoji: "👔", name: "Casey — CTO", gradient: "from-slate-50 to-gray-100", border: "border-slate-300" },
};

function statusLabel(status: string): string {
  switch (status) {
    case "idle": return "Waiting";
    case "running": return "Working...";
    case "completed": return "Done ✓";
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
          ? `⚡ ${completedCount}/7 agents completed`
          : completedCount === 7
            ? "✅ All 7 agents completed"
            : "Submit a task to activate the pipeline."
      }
    >
      {/* Progress bar */}
      <div className="mb-5 h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-500 via-violet-500 to-emerald-500 transition-all duration-700 ease-out"
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
              className={`relative rounded-2xl border p-4 transition-all duration-300 bg-gradient-to-b ${
                isActive
                  ? `${info.gradient} ${info.border} shadow-md agent-running`
                  : isDone
                    ? `${info.gradient} ${info.border} shadow-sm`
                    : "from-white to-slate-50/50 border-slate-200"
              }`}
            >
              {/* Step number */}
              <div className={`absolute -top-2 -left-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shadow-sm ${
                isDone ? "bg-emerald-500 text-white" : isActive ? "bg-accent-500 text-white" : "bg-slate-200 text-slate-500"
              }`}>
                {isDone ? "✓" : idx + 1}
              </div>

              <div className="text-center">
                <span className="text-2xl">{info.emoji}</span>
                <p className="mt-1 text-[11px] font-semibold text-slate-800 leading-tight">{info.name}</p>
              </div>

              {/* Status */}
              <div className="mt-2.5 flex items-center justify-center gap-1.5">
                {isActive ? (
                  <Loader2 className="h-3.5 w-3.5 text-accent-500 animate-spin" />
                ) : isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : null}
                <span className={`text-[11px] font-medium ${
                  isDone ? "text-emerald-600" : isActive ? "text-accent-600" : "text-slate-400"
                }`}>
                  {statusLabel(stage.status)}
                </span>
              </div>

              {/* Summary */}
              <p className="mt-1.5 text-[10px] text-slate-500 leading-snug text-center min-h-[24px] line-clamp-2">
                {stage.summary || stage.label}
              </p>

              {/* Elapsed */}
              {stage.elapsedMs !== undefined && (
                <p className="mt-1 text-center text-[10px] text-slate-400 font-mono">
                  {formatElapsed(stage.elapsedMs)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

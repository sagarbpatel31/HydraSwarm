import { CheckCircle2, Clock3, AlertTriangle, CircleDashed, XCircle } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import type { PipelineStage } from "@/lib/frontend-types";
import { formatElapsed, roleAccent, roleLabel, statusClasses } from "@/lib/utils";

function StatusIcon({ status }: { status: PipelineStage["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4" />;
    case "running":
      return <Clock3 className="h-4 w-4" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4" />;
    case "failed":
      return <XCircle className="h-4 w-4" />;
    default:
      return <CircleDashed className="h-4 w-4" />;
  }
}

export function AgentPipeline({ stages }: { stages: PipelineStage[] }) {
  return (
    <SectionCard title="Agent pipeline" subtitle="Watch the role-based company execute work in sequence.">
      <div className="grid gap-3 xl:grid-cols-7 md:grid-cols-3">
        {stages.map((stage) => (
          <div key={stage.role} className={`rounded-3xl border p-4 status-transition ${
              stage.status === "running"
                ? "border-accent-300 bg-accent-50/30 agent-running"
                : stage.status === "completed"
                  ? "border-emerald-200 bg-emerald-50/30"
                  : "border-slate-200"
            }`}>
            <div className="flex items-center justify-between gap-3">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${roleAccent[stage.role]}`}>
                {roleLabel[stage.role]}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusClasses(stage.status)}`}>
                <StatusIcon status={stage.status} />
                {stage.status}
              </span>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-900">{stage.label}</p>
            <p className="mt-2 min-h-12 text-sm text-slate-500">{stage.summary || "Waiting for task execution."}</p>
            <p className="mt-4 text-xs text-slate-400">Elapsed: {formatElapsed(stage.elapsedMs)}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

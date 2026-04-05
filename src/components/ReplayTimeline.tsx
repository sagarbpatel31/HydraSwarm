import { SectionCard } from "@/components/SectionCard";
import type { ReplayEvent } from "@/lib/frontend-types";
import { formatTimestamp, roleAccent, roleLabel, statusClasses } from "@/lib/utils";

export function ReplayTimeline({ events }: { events: ReplayEvent[] }) {
  return (
    <SectionCard title="Replay timeline" subtitle="Stage order, timing, and memory usage.">
      {events.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">
          Timeline appears after a run completes.
        </p>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {events.map((event, index) => {
            const recalledCount = event.recalledLessonIds?.length ?? 0;
            const elapsed = event.finishedAt && event.startedAt
              ? Math.round((new Date(event.finishedAt).getTime() - new Date(event.startedAt).getTime()) / 1000 * 10) / 10
              : null;

            return (
              <div key={event.id} className="relative flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition">
                {/* Connector dot */}
                <div className="flex flex-col items-center mt-1">
                  <div className={`h-2.5 w-2.5 rounded-full ${
                    event.status === "completed" ? "bg-emerald-500" :
                    event.status === "running" ? "bg-accent-500" :
                    event.status === "failed" ? "bg-rose-500" : "bg-slate-300"
                  }`} />
                  {index < events.length - 1 && (
                    <div className="w-px h-full min-h-[20px] bg-slate-200 mt-1" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${roleAccent[event.role]}`}>
                      {roleLabel[event.role]}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${statusClasses(event.status)}`}>
                      {event.status}
                    </span>
                    {elapsed !== null && (
                      <span className="text-[11px] text-slate-400 font-mono">{elapsed}s</span>
                    )}
                    {recalledCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 ring-1 ring-violet-200">
                        📚 {recalledCount} recalled
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                    {event.summary?.slice(0, 120) || "Processing..."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

import { SectionCard } from "@/components/SectionCard";
import type { ReplayEvent } from "@/lib/frontend-types";
import { formatTimestamp, roleAccent, roleLabel, statusClasses } from "@/lib/utils";

export function ReplayTimeline({ events }: { events: ReplayEvent[] }) {
  return (
    <SectionCard title="Replay timeline" subtitle="A judge-friendly explanation of stage order, timing, and lesson usage.">
      {events.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-sm text-slate-500">
          Timeline events will appear after the orchestrator returns replay data.
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={event.id} className="relative rounded-3xl border border-slate-200 p-4 pl-6">
              {index < events.length - 1 ? (
                <div className="absolute bottom-[-18px] left-[18px] top-[52px] w-px bg-slate-200" />
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${roleAccent[event.role]}`}>
                  {roleLabel[event.role]}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusClasses(event.status)}`}>
                  {event.status}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">{event.summary}</p>
              <div className="mt-2 grid gap-1 text-xs text-slate-500 md:grid-cols-2">
                <span>Started: {formatTimestamp(event.startedAt)}</span>
                <span>Finished: {formatTimestamp(event.finishedAt)}</span>
              </div>
              {event.recalledLessonIds?.length ? (
                <p className="mt-3 text-sm text-slate-600">Recalled: {event.recalledLessonIds.join(", ")}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

import { BrainCircuit, BookOpenText, Sparkles } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import type { MemorySnippet } from "@/lib/types";

const bucketMeta = {
  knowledge: {
    label: "Knowledge",
    icon: BookOpenText,
    classes: "bg-sky-50 text-sky-700 ring-sky-200",
  },
  roleMemory: {
    label: "Role memory",
    icon: BrainCircuit,
    classes: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  sharedMemory: {
    label: "Shared lesson",
    icon: Sparkles,
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
};

export function MemoryPanel({ items }: { items: MemorySnippet[] }) {
  return (
    <SectionCard title="Lessons and recalled context" subtitle="This panel proves HydraDB changed the company between runs.">
      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-sm text-slate-500">
          No recall bundle yet. Seed data and run a task to display role memory, project knowledge, and shared lessons.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const meta = bucketMeta[item.bucket];
            const Icon = meta.icon;
            return (
              <div key={item.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${meta.classes}`}>
                    <Icon className="h-4 w-4" />
                    {meta.label}
                  </span>
                  {item.role ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                      {item.role}
                    </span>
                  ) : null}
                  {typeof item.score === "number" ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                      score {item.score.toFixed(2)}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.content}</p>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

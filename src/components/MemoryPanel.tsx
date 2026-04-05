"use client";

import { useState } from "react";
import { BrainCircuit, BookOpenText, Sparkles, ChevronDown } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import type { MemorySnippet } from "@/lib/frontend-types";

const bucketMeta = {
  knowledge: { label: "Knowledge", icon: BookOpenText, color: "text-sky-600", bg: "bg-sky-50", ring: "ring-sky-200" },
  roleMemory: { label: "Role memory", icon: BrainCircuit, color: "text-violet-600", bg: "bg-violet-50", ring: "ring-violet-200" },
  sharedMemory: { label: "Shared lesson", icon: Sparkles, color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200" },
};

export function MemoryPanel({ items }: { items: MemorySnippet[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Group by bucket
  const grouped = items.reduce<Record<string, MemorySnippet[]>>((acc, item) => {
    const key = item.bucket;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <SectionCard title="Recalled context" subtitle="What agents remembered from HydraDB before working.">
      {items.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">
          Run a task to see what agents recall from institutional memory.
        </p>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {Object.entries(grouped).map(([bucket, bucketItems]) => {
            const meta = bucketMeta[bucket as keyof typeof bucketMeta] ?? bucketMeta.knowledge;
            const Icon = meta.icon;
            return (
              <div key={bucket}>
                {/* Bucket header */}
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 ${meta.color}`} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {meta.label} ({bucketItems.length})
                  </span>
                </div>

                {/* Compact items */}
                <div className="space-y-1">
                  {bucketItems.map((item) => {
                    const isExpanded = expandedId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border transition-all cursor-pointer ${
                          isExpanded ? "border-slate-300 bg-slate-50" : "border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left"
                        >
                          <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${meta.bg} ${meta.color} ${meta.ring}`}>
                            {item.role ?? bucket}
                          </span>
                          <span className="flex-1 text-xs font-medium text-slate-700 truncate">
                            {item.title}
                          </span>
                          {typeof item.score === "number" && (
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {item.score.toFixed(2)}
                            </span>
                          )}
                          <ChevronDown className={`h-3 w-3 text-slate-400 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                        {isExpanded && (
                          <div className="px-3 pb-3">
                            <p className="text-xs text-slate-600 leading-relaxed">{item.content}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

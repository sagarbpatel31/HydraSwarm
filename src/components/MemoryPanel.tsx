"use client";

import { useState } from "react";
import { BrainCircuit, BookOpenText, Sparkles, ChevronDown, Database } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import type { MemorySnippet, AgentRole } from "@/lib/frontend-types";
import { roleLabel } from "@/lib/utils";

const bucketMeta = {
  knowledge: {
    label: "Knowledge Base",
    description: "Company docs, standards, and past artifacts recalled from HydraDB",
    icon: BookOpenText,
    color: "text-sky-700",
    bg: "bg-gradient-to-r from-sky-50 to-sky-100/50",
    border: "border-sky-200",
    dot: "bg-sky-400",
  },
  roleMemory: {
    label: "Agent Memory",
    description: "Personal notes and lessons specific to each agent's role",
    icon: BrainCircuit,
    color: "text-violet-700",
    bg: "bg-gradient-to-r from-violet-50 to-violet-100/50",
    border: "border-violet-200",
    dot: "bg-violet-400",
  },
  sharedMemory: {
    label: "Shared Lessons",
    description: "Organization-wide lessons learned from past runs — the company's institutional memory",
    icon: Sparkles,
    color: "text-emerald-700",
    bg: "bg-gradient-to-r from-emerald-50 to-emerald-100/50",
    border: "border-emerald-200",
    dot: "bg-emerald-400",
  },
};

export function MemoryPanel({ items }: { items: MemorySnippet[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const grouped = items.reduce<Record<string, MemorySnippet[]>>((acc, item) => {
    if (!acc[item.bucket]) acc[item.bucket] = [];
    acc[item.bucket].push(item);
    return acc;
  }, {});

  const totalCount = items.length;

  return (
    <SectionCard title="Recalled Context" subtitle="What HydraDB gave each agent before they started working.">
      {items.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Database className="h-10 w-10 text-slate-200 mb-3" />
          <p className="text-sm font-medium text-slate-500">No context recalled yet</p>
          <p className="text-xs text-slate-400 mt-1">Seed demo data and run a task. Agents will query HydraDB for relevant knowledge.</p>
        </div>
      ) : (
        <div className="space-y-5 max-h-[500px] overflow-y-auto">
          {/* Summary bar */}
          <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-slate-50 to-accent-50/30 border border-slate-200 px-4 py-3">
            <Database className="h-5 w-5 text-accent-500" />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {totalCount} items recalled from HydraDB
              </p>
              <p className="text-xs text-slate-500">
                {Object.entries(grouped).map(([b, items]) => {
                  const meta = bucketMeta[b as keyof typeof bucketMeta];
                  return meta ? `${items.length} ${meta.label.toLowerCase()}` : null;
                }).filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>

          {Object.entries(grouped).map(([bucket, bucketItems]) => {
            const meta = bucketMeta[bucket as keyof typeof bucketMeta] ?? bucketMeta.knowledge;
            const Icon = meta.icon;
            return (
              <div key={bucket} className={`rounded-xl ${meta.bg} ${meta.border} border p-4`}>
                {/* Bucket header */}
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`h-4 w-4 ${meta.color}`} />
                  <span className={`text-sm font-semibold ${meta.color}`}>
                    {meta.label}
                  </span>
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                    {bucketItems.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">{meta.description}</p>

                {/* Items */}
                <div className="space-y-1.5">
                  {bucketItems.map((item) => {
                    const isExpanded = expandedId === item.id;
                    const agentName = item.role && item.role !== "shared"
                      ? roleLabel[item.role as AgentRole] ?? item.role
                      : null;

                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg bg-white border transition-all cursor-pointer ${
                          isExpanded ? "border-slate-300 shadow-sm" : "border-white/60 hover:border-slate-200"
                        }`}
                      >
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left"
                        >
                          <div className={`h-2 w-2 rounded-full ${meta.dot} shrink-0`} />
                          <span className="flex-1 text-xs font-medium text-slate-700 truncate">
                            {item.title}
                          </span>
                          {agentName && (
                            <span className="shrink-0 text-[10px] text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">
                              {agentName}
                            </span>
                          )}
                          {typeof item.score === "number" && (
                            <span className="shrink-0 text-[10px] text-accent-600 font-mono bg-accent-50 rounded px-1.5 py-0.5">
                              {(item.score * 100).toFixed(0)}%
                            </span>
                          )}
                          <ChevronDown className={`h-3 w-3 text-slate-400 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                        {isExpanded && (
                          <div className="px-3 pb-3 border-t border-slate-100 pt-2 mx-2">
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

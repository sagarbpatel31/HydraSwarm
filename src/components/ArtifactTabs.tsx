"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { SectionCard } from "@/components/SectionCard";
import type { AgentArtifact, AgentRole } from "@/lib/frontend-types";
import { statusClasses } from "@/lib/utils";

const agentTabs: Array<{ role: string; emoji: string; label: string; activeColor: string }> = [
  { role: "pm", emoji: "📋", label: "PM", activeColor: "bg-sky-600" },
  { role: "architect", emoji: "🏗️", label: "Architect", activeColor: "bg-indigo-600" },
  { role: "developer", emoji: "💻", label: "Developer", activeColor: "bg-violet-600" },
  { role: "reviewer", emoji: "🔍", label: "Reviewer", activeColor: "bg-amber-600" },
  { role: "qa", emoji: "🧪", label: "QA", activeColor: "bg-emerald-600" },
  { role: "sre", emoji: "🛡️", label: "SRE", activeColor: "bg-rose-600" },
  { role: "cto", emoji: "👔", label: "CTO", activeColor: "bg-slate-700" },
  { role: "shared", emoji: "💡", label: "Lessons", activeColor: "bg-emerald-600" },
];

export function ArtifactTabs({ artifacts }: { artifacts: AgentArtifact[] }) {
  const [selectedRole, setSelectedRole] = useState<string>("pm");

  const selected = useMemo(
    () => artifacts.find((a) => a.role === selectedRole),
    [artifacts, selectedRole],
  );

  // Count artifacts per role for badge
  const countByRole = useMemo(() => {
    const counts: Record<string, number> = {};
    artifacts.forEach((a) => { counts[a.role] = (counts[a.role] ?? 0) + 1; });
    return counts;
  }, [artifacts]);

  if (artifacts.length === 0) {
    return (
      <SectionCard title="Artifacts" subtitle="Click any agent to read their output.">
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-500">Run a task to see agent outputs here.</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Artifacts" subtitle="Click any agent to read their output.">
      {/* Horizontal tab bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 border-b border-slate-200 mb-4">
        {agentTabs.map((tab) => {
          const hasContent = countByRole[tab.role] ?? 0;
          const isSelected = selectedRole === tab.role;
          return (
            <button
              key={tab.role}
              onClick={() => setSelectedRole(tab.role)}
              disabled={!hasContent}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                isSelected
                  ? `${tab.activeColor} text-white shadow-sm`
                  : hasContent
                    ? "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    : "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed"
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content panel — directly below the selected tab */}
      {selected ? (
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800">{selected.title}</h3>
            <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${statusClasses(selected.status)}`}>
              {selected.status || selected.artifactType}
            </span>
            {typeof selected.score === "number" && (
              <span className="rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-bold text-accent-700">
                Score {selected.score}
              </span>
            )}
          </div>

          {/* Markdown content */}
          <div className="p-5 max-h-[450px] overflow-y-auto prose prose-sm prose-slate max-w-none
            prose-headings:text-slate-900 prose-headings:font-semibold
            prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
            prose-p:text-slate-600 prose-p:leading-relaxed
            prose-li:text-slate-600
            prose-strong:text-slate-800
            prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
            prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:text-xs
          ">
            <ReactMarkdown>{selected.content}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-400 text-center py-6">Select an agent tab above to view their output.</p>
      )}
    </SectionCard>
  );
}

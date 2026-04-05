"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Code2, FileText, ShieldAlert, ChevronRight } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import type { AgentArtifact, AgentRole } from "@/lib/frontend-types";
import { roleAccent, roleLabel, statusClasses } from "@/lib/utils";

const agentEmoji: Record<string, string> = {
  pm: "📋",
  architect: "🏗️",
  developer: "💻",
  reviewer: "🔍",
  qa: "🧪",
  sre: "🛡️",
  cto: "👔",
  shared: "💡",
};

function artifactIcon(type: string) {
  if (type.includes("code") || type.includes("implementation")) return <Code2 className="h-4 w-4" />;
  if (type.includes("risk") || type.includes("review") || type.includes("runbook")) return <ShieldAlert className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

export function ArtifactTabs({ artifacts }: { artifacts: AgentArtifact[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(artifacts[0]?.artifactId ?? null);

  const selected = useMemo(
    () => artifacts.find((a) => a.artifactId === selectedId) ?? artifacts[0],
    [artifacts, selectedId],
  );

  return (
    <SectionCard title="Artifacts" subtitle="Click any agent to read their output.">
      {artifacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
          <FileText className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">No artifacts yet</p>
          <p className="text-xs text-slate-400 mt-1">Run a task to see specs, designs, reviews, and more.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          {/* Tab list */}
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
            {artifacts.map((artifact) => {
              const isSelected = artifact.artifactId === selected?.artifactId;
              const emoji = agentEmoji[artifact.role] ?? "📄";

              return (
                <button
                  key={artifact.artifactId}
                  type="button"
                  onClick={() => setSelectedId(artifact.artifactId)}
                  className={`group w-full rounded-xl border p-3 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-accent-300 bg-accent-50 shadow-sm"
                      : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {artifact.role === "shared" ? "Lesson" : roleLabel[artifact.role as AgentRole]}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{artifact.artifactType}</p>
                    </div>
                    <ChevronRight className={`h-4 w-4 shrink-0 transition-colors ${
                      isSelected ? "text-accent-500" : "text-slate-300 group-hover:text-slate-400"
                    }`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Content panel */}
          {selected ? (
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg">{agentEmoji[selected.role] ?? "📄"}</span>
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
              </div>

              {/* Markdown content */}
              <div className="p-5 max-h-[500px] overflow-y-auto prose prose-sm prose-slate max-w-none
                prose-headings:text-slate-900 prose-headings:font-semibold
                prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
                prose-p:text-slate-600 prose-p:leading-relaxed
                prose-li:text-slate-600 prose-li:leading-relaxed
                prose-strong:text-slate-800
                prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:text-xs
                prose-table:text-sm
                prose-th:bg-slate-50 prose-th:p-2
                prose-td:p-2 prose-td:border-slate-200
              ">
                <ReactMarkdown>{selected.content}</ReactMarkdown>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}

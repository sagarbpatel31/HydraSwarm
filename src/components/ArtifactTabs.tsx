"use client";

import { useMemo, useState } from "react";
import { Code2, FileText, ShieldAlert } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import type { AgentArtifact } from "@/lib/frontend-types";
import { roleAccent, roleLabel, statusClasses } from "@/lib/utils";

function artifactIcon(type: string) {
  if (type.includes("code")) return <Code2 className="h-4 w-4" />;
  if (type.includes("risk") || type.includes("review")) return <ShieldAlert className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

export function ArtifactTabs({ artifacts }: { artifacts: AgentArtifact[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(artifacts[0]?.artifactId ?? null);

  const selected = useMemo(
    () => artifacts.find((artifact) => artifact.artifactId === selectedId) ?? artifacts[0],
    [artifacts, selectedId],
  );

  return (
    <SectionCard title="Artifacts" subtitle="Readable outputs from each stage.">
      {artifacts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-sm text-slate-500">
          Run a task to populate spec, design, implementation, review, QA, SRE, and CTO artifacts.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <div className="space-y-2">
            {artifacts.map((artifact) => (
              <button
                key={artifact.artifactId}
                type="button"
                onClick={() => setSelectedId(artifact.artifactId)}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  artifact.artifactId === selected?.artifactId
                    ? "border-accent-300 bg-accent-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ring-1 ${roleAccent[artifact.role as Exclude<typeof artifact.role, "shared">] || "bg-slate-100 text-slate-700 ring-slate-200"}`}>
                    {artifactIcon(artifact.artifactType)}
                    {artifact.role === "shared" ? "Shared" : roleLabel[artifact.role as Exclude<typeof artifact.role, "shared">]}
                  </span>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ring-1 ${statusClasses(artifact.status)}`}>
                    {artifact.status}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{artifact.title}</p>
                <p className="mt-1 text-xs text-slate-500">{artifact.artifactType}</p>
              </button>
            ))}
          </div>

          {selected ? (
            <div className="rounded-3xl border border-slate-200 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusClasses(selected.status)}`}>
                  {selected.status}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                  {selected.artifactType}
                </span>
                {typeof selected.score === "number" ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                    Score {selected.score}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-900">{selected.title}</h3>
              <pre className="mt-4 whitespace-pre-wrap rounded-3xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {selected.content}
              </pre>
            </div>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}

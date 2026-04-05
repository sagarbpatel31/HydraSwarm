"use client";

import { useState } from "react";
import { ArrowRight, TrendingUp, TrendingDown, Minus, Sparkles, AlertTriangle } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import type { RunResult } from "@/lib/frontend-types";
import { roleLabel, statusClasses } from "@/lib/utils";

export function RunComparison({ runs }: { runs: RunResult[] }) {
  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(Math.min(1, runs.length - 1));

  if (runs.length < 2) {
    return (
      <SectionCard title="Run Comparison" subtitle="Need at least 2 runs to compare.">
        <p className="text-sm text-slate-500">Complete two runs to see how the company improved.</p>
      </SectionCard>
    );
  }

  const left = runs[leftIdx];
  const right = runs[rightIdx];

  const leftScore = parseInt(left.decision?.content.match(/Score:\s*(\d+)/i)?.[1] ?? "0", 10);
  const rightScore = parseInt(right.decision?.content.match(/Score:\s*(\d+)/i)?.[1] ?? "0", 10);
  const scoreDelta = rightScore - leftScore;
  const leftRecalled = left.recalledMemory?.length ?? 0;
  const rightRecalled = right.recalledMemory?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Run selector */}
      <SectionCard title="Compare Runs" subtitle="Select two runs to see how institutional memory changed the outcome.">
        <div className="flex items-center gap-4">
          <select
            value={leftIdx}
            onChange={(e) => setLeftIdx(Number(e.target.value))}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
          >
            {runs.map((r, i) => (
              <option key={r.task.taskId} value={i}>
                Run #{i + 1}: {r.task.title.slice(0, 50)}
              </option>
            ))}
          </select>
          <ArrowRight className="h-5 w-5 text-slate-400" />
          <select
            value={rightIdx}
            onChange={(e) => setRightIdx(Number(e.target.value))}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
          >
            {runs.map((r, i) => (
              <option key={r.task.taskId} value={i}>
                Run #{i + 1}: {r.task.title.slice(0, 50)}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      {/* Delta summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Score Change</p>
          <div className="mt-2 flex items-center gap-2">
            {scoreDelta > 0 ? (
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            ) : scoreDelta < 0 ? (
              <TrendingDown className="h-6 w-6 text-rose-500" />
            ) : (
              <Minus className="h-6 w-6 text-slate-400" />
            )}
            <span className={`text-3xl font-bold ${scoreDelta > 0 ? "text-emerald-600" : scoreDelta < 0 ? "text-rose-600" : "text-slate-600"}`}>
              {scoreDelta > 0 ? "+" : ""}{scoreDelta}
            </span>
            <span className="text-sm text-slate-500">({leftScore} → {rightScore})</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Context Recalled</p>
          <div className="mt-2 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent-500" />
            <span className="text-3xl font-bold text-accent-600">
              {rightRecalled - leftRecalled > 0 ? "+" : ""}{rightRecalled - leftRecalled}
            </span>
            <span className="text-sm text-slate-500">({leftRecalled} → {rightRecalled} items)</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">New Lessons Applied</p>
          <div className="mt-2 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <span className="text-3xl font-bold text-amber-600">{right.lessons.length}</span>
            <span className="text-sm text-slate-500">from {left.lessons.length} in Run #{leftIdx + 1}</span>
          </div>
        </div>
      </div>

      {/* Side-by-side artifacts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left run */}
        <SectionCard
          title={`Run #${leftIdx + 1}`}
          subtitle={left.task.title}
          className="border-slate-300"
        >
          <div className="space-y-3">
            {left.artifacts.map((a) => (
              <div key={a.artifactId} className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">
                    {a.role === "shared" ? "Shared" : roleLabel[a.role]}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ring-1 ${statusClasses(a.status)}`}>
                    {a.artifactType}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-600 line-clamp-3">
                  {a.content.slice(0, 200)}
                </p>
              </div>
            ))}
            {left.lessons.length > 0 && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs font-semibold text-amber-800">Lessons Extracted</p>
                {left.lessons.map((l) => (
                  <p key={l.artifactId} className="mt-1 text-xs text-amber-700">{l.content}</p>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

        {/* Right run */}
        <SectionCard
          title={`Run #${rightIdx + 1}`}
          subtitle={right.task.title}
          className="border-accent-300 ring-1 ring-accent-100"
        >
          <div className="space-y-3">
            {right.artifacts.map((a) => {
              // Check if this artifact references lessons from left run
              const referencesLessons = left.lessons.some(
                (l) => a.content.toLowerCase().includes(l.content.toLowerCase().slice(0, 30))
              );
              return (
                <div
                  key={a.artifactId}
                  className={`rounded-2xl border p-3 ${
                    referencesLessons
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">
                      {a.role === "shared" ? "Shared" : roleLabel[a.role]}
                    </span>
                    <div className="flex items-center gap-1">
                      {referencesLessons && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                          <Sparkles className="h-3 w-3" />
                          Improved
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-xs ring-1 ${statusClasses(a.status)}`}>
                        {a.artifactType}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 line-clamp-3">
                    {a.content.slice(0, 200)}
                  </p>
                </div>
              );
            })}
            {right.lessons.length > 0 && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3">
                <p className="text-xs font-semibold text-emerald-800">New Lessons Extracted</p>
                {right.lessons.map((l) => (
                  <p key={l.artifactId} className="mt-1 text-xs text-emerald-700">{l.content}</p>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Learning proof */}
      <SectionCard title="Why Run #{rightIdx + 1} is better" subtitle="The institutional memory that changed between runs.">
        <div className="rounded-2xl bg-gradient-to-r from-accent-50 to-emerald-50 border border-accent-200 p-5">
          <p className="text-sm font-semibold text-slate-900">Learning Loop Proof</p>
          <div className="mt-3 space-y-2">
            {left.lessons.map((l) => (
              <div key={l.artifactId} className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-accent-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-800">[{l.title}] {l.content}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Stored after Run #{leftIdx + 1} → Recalled by agents in Run #{rightIdx + 1}
                  </p>
                </div>
              </div>
            ))}
            {left.lessons.length === 0 && (
              <p className="text-sm text-slate-500">No lessons from Run #{leftIdx + 1} to compare.</p>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

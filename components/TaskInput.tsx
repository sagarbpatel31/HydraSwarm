"use client";

import { useState } from "react";
import { Loader2, Play, RotateCcw, DatabaseZap } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";

interface TaskInputProps {
  onRun: (payload: { title: string; description: string; project: string }) => Promise<void>;
  onSeed: () => Promise<void>;
  onReset: () => void;
  busy: boolean;
  seeding: boolean;
}

const presets = [
  {
    title: "Add rate limiting and audit logs to the billing API",
    description:
      "Implement endpoint-level and service-level rate limiting for billing API routes and add audit logging for admin actions. Avoid latency regressions and preserve current invoice processing throughput.",
    project: "billing-api",
  },
  {
    title: "Add rate limiting and audit logging to invoice endpoints",
    description:
      "Extend the invoice endpoints with safe rate limiting and asynchronous audit logging. Past rollout had inconsistent enforcement, so design for reuse across handlers and services.",
    project: "billing-api",
  },
];

export function TaskInput({ onRun, onSeed, onReset, busy, seeding }: TaskInputProps) {
  const [title, setTitle] = useState(presets[0].title);
  const [description, setDescription] = useState(presets[0].description);
  const [project, setProject] = useState(presets[0].project);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onRun({ title, description, project });
  };

  return (
    <SectionCard
      title="Task intake"
      subtitle="Seed the demo, submit a feature request, and compare Task A vs Task B improvements."
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSeed}
            disabled={busy || seeding}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-accent-300 hover:text-accent-700 disabled:opacity-50"
          >
            {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseZap className="h-4 w-4" />}
            Seed demo data
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
          >
            <RotateCcw className="h-4 w-4" />
            Reset view
          </button>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[1.8fr_1fr]">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Feature request title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-0 transition focus:border-accent-400"
              placeholder="Add rate limiting and audit logs to the billing API"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Project</span>
            <input
              value={project}
              onChange={(event) => setProject(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-accent-400"
              placeholder="billing-api"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-accent-400"
            placeholder="Describe the engineering task, constraints, and rollout concerns."
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={busy || seeding}
            className="inline-flex items-center gap-2 rounded-2xl bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run HydraSwarm
          </button>

          {presets.map((preset, index) => (
            <button
              key={preset.title}
              type="button"
              onClick={() => {
                setTitle(preset.title);
                setDescription(preset.description);
                setProject(preset.project);
              }}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-accent-300 hover:text-accent-700"
            >
              Load Task {index + 1}
            </button>
          ))}
        </div>
      </form>
    </SectionCard>
  );
}

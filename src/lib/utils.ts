import { clsx } from "clsx";
import type { AgentRole } from "@/lib/frontend-types";

export function cn(...inputs: Array<string | false | null | undefined>) {
  return clsx(inputs);
}

export const roleLabel: Record<AgentRole, string> = {
  pm: "PM",
  architect: "Architect",
  developer: "Developer",
  reviewer: "Reviewer",
  qa: "QA",
  sre: "SRE",
  cto: "CTO",
};

export const roleAccent: Record<AgentRole, string> = {
  pm: "bg-sky-50 text-sky-700 ring-sky-200",
  architect: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  developer: "bg-violet-50 text-violet-700 ring-violet-200",
  reviewer: "bg-amber-50 text-amber-700 ring-amber-200",
  qa: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  sre: "bg-rose-50 text-rose-700 ring-rose-200",
  cto: "bg-slate-100 text-slate-700 ring-slate-300",
};

export function statusClasses(status: string) {
  switch (status) {
    case "completed":
    case "approved":
    case "passed":
    case "done":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "running":
    case "recalling":
    case "generating":
    case "storing":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "warning":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "failed":
    case "rejected":
    case "error":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

export function formatElapsed(ms?: number) {
  if (!ms && ms !== 0) return "--";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function formatTimestamp(value?: string) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

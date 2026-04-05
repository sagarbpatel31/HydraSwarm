"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";

export interface LogEntry {
  id: string;
  timestamp: string;
  agent: string;
  emoji: string;
  type: "recall" | "generate" | "store" | "done" | "lesson" | "info";
  message: string;
}

const typeColors: Record<string, { dot: string; text: string; bg: string }> = {
  recall: { dot: "bg-violet-400", text: "text-violet-700", bg: "bg-violet-50" },
  generate: { dot: "bg-accent-400", text: "text-accent-700", bg: "bg-accent-50" },
  store: { dot: "bg-emerald-400", text: "text-emerald-700", bg: "bg-emerald-50" },
  done: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  lesson: { dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50" },
  info: { dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-50" },
};

const typeLabels: Record<string, string> = {
  recall: "RECALL",
  generate: "LLM",
  store: "STORE",
  done: "DONE",
  lesson: "LESSON",
  info: "INFO",
};

export function ThinkingLog({ entries }: { entries: LogEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <SectionCard
      title="🧠 Agent Thinking Log"
      subtitle="Live feed of what each agent is doing — recall, generation, and storage operations."
    >
      {entries.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center">
          <Terminal className="h-8 w-8 text-slate-200 mb-2" />
          <p className="text-xs text-slate-400">Run a task to see agents think in real-time.</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="max-h-[300px] overflow-y-auto rounded-xl bg-slate-950 p-4 font-mono text-xs space-y-1.5"
        >
          {entries.map((entry, i) => {
            const colors = typeColors[entry.type] ?? typeColors.info;
            const label = typeLabels[entry.type] ?? "LOG";
            return (
              <div key={entry.id} className="flex items-start gap-2 animate-in" style={{ animationDelay: `${i * 20}ms` }}>
                <span className="text-slate-600 shrink-0 w-[52px]">{entry.timestamp}</span>
                <span className="shrink-0">{entry.emoji}</span>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${colors.bg} ${colors.text}`}>
                  {label}
                </span>
                <span className="text-slate-300">{entry.message}</span>
              </div>
            );
          })}
          {/* Blinking cursor */}
          <div className="flex items-center gap-1 mt-1">
            <span className="text-slate-600">{">"}</span>
            <span className="w-2 h-4 bg-emerald-400 animate-pulse rounded-sm" />
          </div>
        </div>
      )}
    </SectionCard>
  );
}

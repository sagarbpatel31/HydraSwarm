"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, BookOpenText, BrainCircuit, Sparkles, Database, RefreshCw } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import { roleLabel, roleAccent } from "@/lib/utils";
import type { AgentRole } from "@/lib/frontend-types";

interface MemoryItem {
  id: string;
  title: string;
  content: string;
  score: number;
  sourceType?: string;
  metadata?: Record<string, unknown>;
}

interface ExploreData {
  knowledge: MemoryItem[];
  shared: MemoryItem[];
  agents: Record<string, MemoryItem[]>;
  stats: {
    knowledgeCount: number;
    sharedCount: number;
    agentCount: number;
    totalCount: number;
  };
}

type Tab = "all" | "knowledge" | "shared" | "agents";

export function MemoryExplorer() {
  const [data, setData] = useState<ExploreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("engineering software development");
  const [tab, setTab] = useState<Tab>("all");
  const [selectedAgent, setSelectedAgent] = useState<AgentRole | "all">("all");

  const fetchMemory = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/memory/explore?q=${encodeURIComponent(q)}`);
      const json = await resp.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemory(query);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMemory(query);
  };

  const allAgentRoles = data ? (Object.keys(data.agents) as AgentRole[]) : [];

  return (
    <div className="space-y-6">
      {/* Stats */}
      {data?.stats && (
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Total Items", value: data.stats.totalCount, icon: Database, color: "text-accent-600" },
            { label: "Knowledge", value: data.stats.knowledgeCount, icon: BookOpenText, color: "text-sky-600" },
            { label: "Shared Lessons", value: data.stats.sharedCount, icon: Sparkles, color: "text-emerald-600" },
            { label: "Agent Memories", value: data.stats.agentCount, icon: BrainCircuit, color: "text-violet-600" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex items-center gap-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{stat.label}</p>
              </div>
              <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <SectionCard
        title="HydraDB Memory Explorer"
        subtitle="Browse and search institutional memory. This is what makes the AI company smarter over time."
      >
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-accent-400"
              placeholder="Search HydraDB memory..."
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </button>
        </form>

        {/* Tabs */}
        <div className="mt-4 flex gap-2 border-b border-slate-200 pb-1">
          {(["all", "knowledge", "shared", "agents"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-t-xl px-4 py-2 text-sm font-medium transition ${
                tab === t
                  ? "bg-accent-50 text-accent-700 border-b-2 border-accent-500"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "all" ? "All" : t === "knowledge" ? "Knowledge" : t === "shared" ? "Shared Lessons" : "Agent Memories"}
            </button>
          ))}
        </div>

        {/* Agent filter (when agents tab selected) */}
        {tab === "agents" && allAgentRoles.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedAgent("all")}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                selectedAgent === "all" ? "bg-accent-100 text-accent-700 ring-accent-300" : "bg-slate-50 text-slate-600 ring-slate-200"
              }`}
            >
              All agents
            </button>
            {allAgentRoles.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedAgent(role)}
                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                  selectedAgent === role ? roleAccent[role] : "bg-slate-50 text-slate-600 ring-slate-200"
                }`}
              >
                {roleLabel[role]}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto">
          {loading && <p className="text-sm text-slate-500 animate-pulse">Searching HydraDB...</p>}

          {!loading && data && (
            <>
              {(tab === "all" || tab === "knowledge") &&
                data.knowledge.map((item) => (
                  <MemoryCard key={`k-${item.id}`} item={item} bucket="knowledge" />
                ))}

              {(tab === "all" || tab === "shared") &&
                data.shared.map((item) => (
                  <MemoryCard key={`s-${item.id}`} item={item} bucket="shared" />
                ))}

              {(tab === "all" || tab === "agents") &&
                Object.entries(data.agents)
                  .filter(([role]) => selectedAgent === "all" || role === selectedAgent)
                  .flatMap(([role, items]) =>
                    items.map((item) => (
                      <MemoryCard key={`a-${role}-${item.id}`} item={item} bucket="agent" agentRole={role} />
                    ))
                  )}
            </>
          )}

          {!loading && data?.stats.totalCount === 0 && (
            <p className="text-sm text-slate-500 py-8 text-center">
              No memories found. Seed demo data first, then run a task to populate the memory.
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function MemoryCard({
  item,
  bucket,
  agentRole,
}: {
  item: MemoryItem;
  bucket: "knowledge" | "shared" | "agent";
  agentRole?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const bucketConfig = {
    knowledge: { label: "Knowledge", icon: BookOpenText, classes: "bg-sky-50 text-sky-700 ring-sky-200" },
    shared: { label: "Shared Lesson", icon: Sparkles, classes: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    agent: { label: "Agent Memory", icon: BrainCircuit, classes: "bg-violet-50 text-violet-700 ring-violet-200" },
  };

  const config = bucketConfig[bucket];
  const Icon = config.icon;

  return (
    <div
      className="rounded-2xl border border-slate-200 p-4 cursor-pointer hover:bg-slate-50 transition"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${config.classes}`}>
          <Icon className="h-3.5 w-3.5" />
          {config.label}
        </span>
        {agentRole && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${roleAccent[agentRole as AgentRole] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}>
            {roleLabel[agentRole as AgentRole] ?? agentRole}
          </span>
        )}
        {item.score > 0 && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            relevance: {item.score.toFixed(2)}
          </span>
        )}
      </div>
      <h4 className="mt-2 text-sm font-semibold text-slate-900">{item.title}</h4>
      <p className={`mt-1 text-sm text-slate-600 ${expanded ? "" : "line-clamp-2"}`}>
        {item.content}
      </p>
      {!expanded && item.content.length > 150 && (
        <p className="mt-1 text-xs text-accent-600">Click to expand</p>
      )}
    </div>
  );
}

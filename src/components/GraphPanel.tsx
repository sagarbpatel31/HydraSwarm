"use client";

import { useMemo } from "react";
import ReactFlow, { Background, Controls, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import { SectionCard } from "@/components/SectionCard";
import type { RunResult } from "@/lib/frontend-types";

const nodeColors: Record<string, { bg: string; border: string }> = {
  task: { bg: "#eef6ff", border: "#93c5fd" },
  pm: { bg: "#f0f9ff", border: "#7dd3fc" },
  architect: { bg: "#eef2ff", border: "#a5b4fc" },
  developer: { bg: "#f5f3ff", border: "#c4b5fd" },
  reviewer: { bg: "#fffbeb", border: "#fcd34d" },
  qa: { bg: "#ecfdf5", border: "#6ee7b7" },
  sre: { bg: "#fff1f2", border: "#fda4af" },
  cto: { bg: "#f8fafc", border: "#94a3b8" },
  lesson: { bg: "#ecfdf5", border: "#34d399" },
  entity: { bg: "#f8fafc", border: "#cbd5e1" },
};

export function GraphPanel({ graph }: { graph: RunResult["graph"] }) {
  const styledNodes = useMemo(
    () =>
      graph.nodes.map((n) => {
        const type = (n.data?.nodeType as string) ?? "entity";
        const colors = nodeColors[type] ?? nodeColors.entity;
        return {
          ...n,
          style: {
            background: colors.bg,
            border: `2px solid ${colors.border}`,
            borderRadius: 12,
            padding: "10px 16px",
            fontSize: 11,
            fontWeight: 600,
            color: "#1e293b",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          },
        };
      }),
    [graph.nodes],
  );

  const styledEdges = useMemo(
    () =>
      graph.edges.map((edge) => ({
        ...edge,
        markerEnd: { type: MarkerType.ArrowClosed, color: edge.animated ? "#10b981" : "#94a3b8" },
        style: { stroke: edge.animated ? "#10b981" : "#cbd5e1", strokeWidth: 2 },
        labelStyle: { fontSize: 9, fill: "#94a3b8", fontWeight: 500 },
      })),
    [graph.edges],
  );

  return (
    <SectionCard title="Task Lineage Graph" subtitle="">
      {graph.nodes.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <p className="text-sm text-slate-500">Graph appears after a run completes.</p>
        </div>
      ) : (
        <div className="h-[500px] rounded-2xl border border-slate-200 bg-white overflow-hidden relative">
          <ReactFlow fitView nodes={styledNodes} edges={styledEdges} minZoom={0.3} maxZoom={1.5}>
            <Background gap={24} size={1} color="#f1f5f9" />
            <Controls showInteractive={false} position="bottom-right" />
          </ReactFlow>
        </div>
      )}
    </SectionCard>
  );
}

"use client";

import { useMemo } from "react";
import ReactFlow, { Background, Controls, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import { SectionCard } from "@/components/SectionCard";
import type { RunResult } from "@/lib/frontend-types";

export function GraphPanel({ graph }: { graph: RunResult["graph"] }) {
  const edges = useMemo(
    () =>
      graph.edges.map((edge) => ({
        ...edge,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: edge.animated ? "#10b981" : "#94a3b8", strokeWidth: 2 },
        labelStyle: { fontSize: 10, fill: "#64748b" },
      })),
    [graph.edges],
  );

  return (
    <SectionCard title="Task lineage graph" subtitle="How each stage connects: task → agents → lessons.">
      {graph.nodes.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">
          Graph appears after a run completes.
        </p>
      ) : (
        <div className="h-[550px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <ReactFlow
            fitView
            nodes={graph.nodes.map((n) => ({
              ...n,
              style: {
                background: n.data?.nodeType === "lesson" ? "#ecfdf5" :
                             n.data?.nodeType === "task" ? "#eef6ff" : "#ffffff",
                border: `1px solid ${n.data?.nodeType === "lesson" ? "#a7f3d0" :
                                      n.data?.nodeType === "task" ? "#bfdbfe" : "#e2e8f0"}`,
                borderRadius: 12,
                padding: "8px 14px",
                fontSize: 11,
                fontWeight: 500,
                color: "#334155",
              },
            }))}
            edges={edges}
          >
            <Background gap={20} size={1} color="#f1f5f9" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      )}
    </SectionCard>
  );
}

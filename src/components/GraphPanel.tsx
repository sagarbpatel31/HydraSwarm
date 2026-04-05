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
      })),
    [graph.edges],
  );

  return (
    <SectionCard title="Task lineage graph" subtitle="How task -> spec -> design -> review -> lesson evolved.">
      {graph.nodes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-sm text-slate-500">
          Graph data will appear after a run completes.
        </div>
      ) : (
        <div className="h-[420px] overflow-hidden rounded-3xl border border-slate-200">
          <ReactFlow fitView nodes={graph.nodes} edges={edges}>
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      )}
    </SectionCard>
  );
}

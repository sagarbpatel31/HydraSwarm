import { NextRequest, NextResponse } from "next/server";
import { getGraphRelations } from "@/lib/hydra";
import { getAllRuns } from "@/lib/workflow/orchestrator";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get("sourceId");
  const runId = searchParams.get("runId");

  // If sourceId provided, fetch graph relations from HydraDB
  if (sourceId) {
    const graph = await getGraphRelations(sourceId);
    return NextResponse.json(graph);
  }

  // If runId provided, build a task lineage graph from artifacts
  if (runId) {
    const run = getAllRuns().find((r) => r.id === runId);
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const nodes = [
      { id: run.id, label: run.taskDescription.slice(0, 40), type: "task" },
      ...run.steps
        .filter((s) => s.artifact)
        .map((s) => ({
          id: s.artifact!.id,
          label: `${s.agentRole.toUpperCase()}: ${s.artifact!.artifactType}`,
          type: s.agentRole,
        })),
    ];

    const edges = run.steps
      .filter((s) => s.artifact)
      .map((s, i) => ({
        source: i === 0 ? run.id : run.steps[i - 1]?.artifact?.id ?? run.id,
        target: s.artifact!.id,
        relation: "produces",
      }));

    // Add lesson edges if evaluation exists
    if (run.evaluation?.lessonsExtracted) {
      for (const lesson of run.evaluation.lessonsExtracted) {
        nodes.push({
          id: lesson.id,
          label: lesson.insight.slice(0, 40),
          type: "lesson",
        });
        edges.push({
          source: run.steps[run.steps.length - 1]?.artifact?.id ?? run.id,
          target: lesson.id,
          relation: "extracted_lesson",
        });
      }
    }

    return NextResponse.json({ nodes, edges });
  }

  return NextResponse.json(
    { error: "Provide sourceId or runId query parameter" },
    { status: 400 }
  );
}

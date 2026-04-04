import { NextRequest, NextResponse } from "next/server";
import { getAllRuns } from "@/lib/workflow/orchestrator";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ artifactId: string }> }
) {
  const { artifactId } = await params;

  for (const run of getAllRuns()) {
    for (const step of run.steps) {
      if (step.artifact?.id === artifactId) {
        return NextResponse.json({ artifact: step.artifact });
      }
    }
  }

  return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
}

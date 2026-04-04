import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { startRun, getAllRuns } from "@/lib/workflow/orchestrator";

const StartRunSchema = z.object({
  taskDescription: z.string().min(5, "Task description must be at least 5 characters"),
  mock: z.boolean().optional(),
  similarityKey: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = StartRunSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { taskDescription, mock, similarityKey } = parsed.data;
    const runId = startRun(taskDescription, { mock, similarityKey });

    return NextResponse.json({ runId, status: "queued" }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start run" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const runs = getAllRuns().map((r) => ({
    id: r.id,
    taskDescription: r.taskDescription,
    similarityKey: r.similarityKey,
    status: r.status,
    runNumber: r.runNumber,
    createdAt: r.createdAt,
    completedAt: r.completedAt,
    stepsCompleted: r.steps.filter((s) => s.status === "done").length,
    totalSteps: r.steps.length,
  }));

  return NextResponse.json({ runs });
}

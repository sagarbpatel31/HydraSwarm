import { NextResponse } from "next/server";
import { getAllRuns } from "@/lib/workflow/orchestrator";
import { Lesson } from "@/types/run";

export async function GET() {
  const lessons: Lesson[] = [];

  for (const run of getAllRuns()) {
    if (run.evaluation?.lessonsExtracted) {
      lessons.push(...run.evaluation.lessonsExtracted);
    }
  }

  // Sort newest first
  lessons.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ lessons });
}

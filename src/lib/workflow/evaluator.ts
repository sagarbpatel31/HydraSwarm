import { v4 as uuid } from "uuid";
import { Artifact, Lesson } from "@/types/run";
import { callClaude } from "@/lib/llm";

export async function extractLessons(
  runId: string,
  artifacts: Artifact[]
): Promise<Lesson[]> {
  const artifactSummaries = artifacts
    .map((a) => `### ${a.agentRole} (${a.artifactType})\n${a.content.slice(0, 500)}`)
    .join("\n\n");

  const prompt = `You are a retrospective analyst for a software engineering team.

Given the following artifacts from a task run, extract 1-3 organizational lessons learned.
Focus on:
- What went wrong or could go wrong
- What patterns should be reused
- What anti-patterns were identified

Artifacts:
${artifactSummaries}

Return a JSON array of lessons. Each lesson must have:
- "category": one of "architecture", "testing", "process", "performance", "reliability"
- "insight": a concise, actionable lesson (1-2 sentences)

Return ONLY the JSON array, no other text.`;

  try {
    const response = await callClaude(prompt, {
      temperature: 0.3,
      maxTokens: 1024,
    });

    // Parse JSON from response (handle markdown code blocks)
    const jsonStr = response
      .replace(/```json?\n?/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed)) return [];

    return parsed.slice(0, 3).map(
      (item: { category?: string; insight?: string }) => ({
        id: `lesson-${uuid().slice(0, 8)}`,
        category: item.category ?? "process",
        insight: item.insight ?? "No insight extracted",
        source: runId,
        createdAt: new Date().toISOString(),
      })
    );
  } catch (err) {
    console.error("Lesson extraction failed:", err);
    return [
      {
        id: `lesson-${uuid().slice(0, 8)}`,
        category: "process",
        insight:
          "Lesson extraction failed — review artifacts manually for improvement opportunities.",
        source: runId,
        createdAt: new Date().toISOString(),
      },
    ];
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  recallKnowledge,
  recallAgentMemory,
  recallSharedMemory,
} from "@/lib/hydra";
import { AGENT_ORDER } from "@/types/run";

// Wrap a promise with a timeout
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "engineering software development";
  const TIMEOUT = 8000; // 8 second timeout per call

  try {
    // Fetch knowledge and shared in parallel (most important)
    const [knowledge, shared] = await Promise.all([
      withTimeout(recallKnowledge(query, 10).catch(() => []), TIMEOUT, []),
      withTimeout(recallSharedMemory(query, 10).catch(() => []), TIMEOUT, []),
    ]);

    // Fetch agent memories in parallel (with individual timeouts)
    const agentResults = await Promise.all(
      AGENT_ORDER.map((role) =>
        withTimeout(
          recallAgentMemory(role, query, 3).catch(() => []),
          TIMEOUT,
          []
        ).then((items) => ({ role, items }))
      )
    );

    const agentMemoryMap: Record<string, typeof knowledge> = {};
    for (const { role, items } of agentResults) {
      if (items.length > 0) {
        agentMemoryMap[role] = items;
      }
    }

    const agentCount = Object.values(agentMemoryMap).reduce((sum, arr) => sum + arr.length, 0);

    return NextResponse.json({
      knowledge,
      shared,
      agents: agentMemoryMap,
      stats: {
        knowledgeCount: knowledge.length,
        sharedCount: shared.length,
        agentCount,
        totalCount: knowledge.length + shared.length + agentCount,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to explore memory" },
      { status: 500 }
    );
  }
}

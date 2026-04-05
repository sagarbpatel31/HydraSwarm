import { NextRequest, NextResponse } from "next/server";
import {
  recallKnowledge,
  recallAgentMemory,
  recallSharedMemory,
} from "@/lib/hydra";
import { AGENT_ORDER } from "@/types/run";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "engineering software development";

  try {
    // Fetch all memory types in parallel
    const [knowledge, shared, ...agentMemories] = await Promise.all([
      recallKnowledge(query, 10).catch(() => []),
      recallSharedMemory(query, 10).catch(() => []),
      ...AGENT_ORDER.map((role) =>
        recallAgentMemory(role, query, 5).catch(() => [])
      ),
    ]);

    // Build per-agent memory map
    const agentMemoryMap: Record<string, typeof knowledge> = {};
    AGENT_ORDER.forEach((role, i) => {
      if (agentMemories[i]?.length > 0) {
        agentMemoryMap[role] = agentMemories[i];
      }
    });

    return NextResponse.json({
      knowledge,
      shared,
      agents: agentMemoryMap,
      stats: {
        knowledgeCount: knowledge.length,
        sharedCount: shared.length,
        agentCount: Object.values(agentMemoryMap).reduce((sum, arr) => sum + arr.length, 0),
        totalCount: knowledge.length + shared.length + Object.values(agentMemoryMap).reduce((sum, arr) => sum + arr.length, 0),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to explore memory" },
      { status: 500 }
    );
  }
}

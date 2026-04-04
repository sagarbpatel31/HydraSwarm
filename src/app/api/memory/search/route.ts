import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  recallKnowledge,
  recallAgentMemory,
  recallSharedMemory,
} from "@/lib/hydra";

const SearchSchema = z.object({
  query: z.string().min(1),
  type: z.enum(["knowledge", "agent", "shared", "all"]).optional().default("all"),
  role: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SearchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { query, type, role } = parsed.data;

    switch (type) {
      case "knowledge": {
        const results = await recallKnowledge(query);
        return NextResponse.json({ results, type: "knowledge" });
      }
      case "agent": {
        const results = await recallAgentMemory(role ?? "pm", query);
        return NextResponse.json({ results, type: "agent" });
      }
      case "shared": {
        const results = await recallSharedMemory(query);
        return NextResponse.json({ results, type: "shared" });
      }
      case "all":
      default: {
        const [knowledge, shared] = await Promise.all([
          recallKnowledge(query).catch(() => []),
          recallSharedMemory(query).catch(() => []),
        ]);
        return NextResponse.json({
          results: [...knowledge, ...shared],
          type: "all",
        });
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 500 }
    );
  }
}

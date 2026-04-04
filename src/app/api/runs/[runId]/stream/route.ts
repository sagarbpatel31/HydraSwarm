import { NextRequest } from "next/server";
import { getRun, subscribe } from "@/lib/workflow/orchestrator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const run = getRun(runId);

  if (!run) {
    return new Response(JSON.stringify({ error: "Run not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const writeSSE = (event: string, data: unknown) => {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    writer.write(encoder.encode(payload)).catch(() => {
      // Client disconnected
    });
  };

  // If run is already completed, send final state and close
  if (run.status === "completed" || run.status === "failed") {
    writeSSE("run_complete", run);
    writer.close();
    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Send current state of all steps
  for (const step of run.steps) {
    if (step.status !== "pending") {
      writeSSE("step_update", step);
    }
  }

  // Subscribe to live updates
  const unsubscribe = subscribe(runId, (event, data) => {
    writeSSE(event, data);

    if (event === "run_complete" || event === "error") {
      setTimeout(() => {
        writer.close().catch(() => {});
      }, 100);
    }
  });

  // Clean up on client disconnect
  request.signal.addEventListener("abort", () => {
    unsubscribe();
    writer.close().catch(() => {});
  });

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

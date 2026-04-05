import type { AgentRole } from "@/lib/frontend-types";

export interface StreamEvent {
  type: "step_update" | "run_complete" | "run_started" | "error";
  data: StepUpdateData | RunCompleteData | ErrorData;
}

export interface StepUpdateData {
  agentRole: AgentRole;
  status: "pending" | "recalling" | "generating" | "storing" | "done" | "error";
  recallContext?: string[];
  artifact?: {
    id: string;
    agentRole: AgentRole;
    artifactType: string;
    title: string;
    content: string;
    metadata: Record<string, unknown>;
    createdAt: string;
  };
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface RunCompleteData {
  id: string;
  status: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  steps: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  evaluation?: any;
  completedAt?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface ErrorData {
  message: string;
}

/**
 * Connect to the SSE stream for a run and call onEvent for each event.
 * Returns a cleanup function to close the connection.
 */
export function connectToRunStream(
  runId: string,
  onEvent: (event: StreamEvent) => void,
  onError?: (error: Error) => void
): () => void {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  const url = `${base}/api/runs/${runId}/stream`;

  const eventSource = new EventSource(url);

  eventSource.addEventListener("step_update", (e) => {
    try {
      const data = JSON.parse(e.data) as StepUpdateData;
      onEvent({ type: "step_update", data });
    } catch {
      // ignore parse errors
    }
  });

  eventSource.addEventListener("run_complete", (e) => {
    try {
      const data = JSON.parse(e.data) as RunCompleteData;
      onEvent({ type: "run_complete", data });
      eventSource.close();
    } catch {
      // ignore
    }
  });

  eventSource.addEventListener("run_started", (e) => {
    try {
      const data = JSON.parse(e.data);
      onEvent({ type: "run_started", data });
    } catch {
      // ignore
    }
  });

  eventSource.addEventListener("error", () => {
    onError?.(new Error("SSE connection lost"));
  });

  eventSource.onerror = () => {
    // EventSource auto-reconnects, but if the run is done we should close
    setTimeout(() => {
      if (eventSource.readyState === EventSource.CLOSED) {
        onError?.(new Error("SSE connection closed"));
      }
    }, 2000);
  };

  return () => {
    eventSource.close();
  };
}

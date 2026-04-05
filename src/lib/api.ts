import type { AgentArtifact, FlowNode, FlowEdge, MemorySnippet, RunResult } from "@/lib/frontend-types";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function seedDemo() {
  const response = await fetch(`${BASE}/api/seed`, { method: "POST" });
  // Backend returns { success, knowledgeCount, memoryCount, sharedCount, errors }
  // Frontend expects { ok, message }
  const data = await readJson<{
    success: boolean;
    knowledgeCount: number;
    memoryCount: number;
    sharedCount: number;
    errors: string[];
  }>(response);
  return {
    ok: data.success,
    message: data.success
      ? `Seeded ${data.knowledgeCount} knowledge docs, ${data.memoryCount} agent memories, ${data.sharedCount} shared lessons.`
      : `Partial seed: ${data.errors.length} errors. ${data.knowledgeCount} docs, ${data.memoryCount} memories loaded.`,
  };
}

// Start a run, poll until complete, transform into RunResult
export async function runTask(payload: {
  title: string;
  description: string;
  project: string;
}) {
  const body = {
    taskDescription: `${payload.title} - ${payload.description}`,
    similarityKey: payload.project,
  };

  const startResp = await fetch(`${BASE}/api/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const startJson = await readJson<{ runId: string }>(startResp);
  const runId = startJson.runId;

  // Poll for completion
  const timeoutMs = 180_000; // 3 minutes
  const intervalMs = 1500;
  const startAt = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let run: any | null = null;

  while (Date.now() - startAt < timeoutMs) {
    const r = await fetch(`${BASE}/api/runs/${runId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const j = await readJson<{ run?: any }>(r);
    run = j.run ?? null;
    if (!run) throw new Error("Run not found");
    if (run.status === "completed" || run.status === "failed") break;
    await new Promise((res) => setTimeout(res, intervalMs));
  }

  if (!run) throw new Error("Run did not complete in time");

  // Build RunResult
  const task = {
    taskId: run.id,
    title: run.taskDescription.slice(0, 120),
    description: run.taskDescription,
    project: run.similarityKey,
    similarityKey: run.similarityKey,
    runNumber: run.runNumber,
  };

  const artifacts: AgentArtifact[] = run.steps
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((s: any) => s.artifact)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any) => ({
      artifactId: s.artifact.id,
      taskId: run.id,
      role: s.artifact.agentRole,
      artifactType: s.artifact.artifactType,
      title: s.artifact.title,
      content: s.artifact.content,
      status: s.status ?? "",
      metadata: s.artifact.metadata ?? {},
    }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lessons = (run.evaluation?.lessonsExtracted ?? []).map((l: any) => ({
    artifactId: l.id,
    taskId: run.id,
    role: "shared" as const,
    artifactType: "lesson",
    title: l.category,
    content: l.insight,
    status: "",
    metadata: { source: l.source },
  }));

  const decision = artifacts.find((a) => a.role === "cto") || null;

  // Fetch graph and transform to ReactFlow format
  const graphResp = await fetch(`${BASE}/api/memory/graph?runId=${run.id}`);
  const rawGraph = await readJson<{
    nodes: Array<{ id: string; label: string; type: string }>;
    edges: Array<{ source: string; target: string; relation: string }>;
  }>(graphResp);

  const graph = transformGraph(rawGraph);

  // Build replay timeline
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const replay = run.steps.map((s: any) => ({
    id: s.artifact?.id ?? `${run.id}-${s.agentRole}`,
    role: s.agentRole,
    startedAt: s.startedAt,
    finishedAt: s.completedAt,
    summary: s.artifact?.content?.slice(0, 240) ?? "",
    recalledLessonIds: s.recallContext?.filter((c: string) => c) ?? [],
    status: mapStatus(s.status),
  }));

  // Build recalled memory from step recall contexts
  const recalledMemory: MemorySnippet[] = run.steps
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((s: any) => s.recallContext?.length > 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .flatMap((s: any, idx: number) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      s.recallContext.filter((c: string) => c).map((title: string, i: number) => ({
        id: `recall-${idx}-${i}`,
        title: title || "Recalled item",
        content: `Recalled by ${s.agentRole} agent during task processing.`,
        bucket: i < 3 ? "knowledge" as const : i < 5 ? "roleMemory" as const : "sharedMemory" as const,
        role: s.agentRole,
      }))
    );

  return {
    task,
    artifacts,
    lessons,
    decision,
    graph,
    replay,
    recalledMemory,
  } as RunResult;
}

function transformGraph(rawGraph: {
  nodes: Array<{ id: string; label: string; type: string }>;
  edges: Array<{ source: string; target: string; relation: string }>;
}): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = rawGraph.nodes.map((n, i) => ({
    id: n.id,
    type: "default",
    position: { x: 50, y: i * 100 },
    data: { label: n.label, nodeType: n.type },
  }));

  const edges: FlowEdge[] = rawGraph.edges.map((e, i) => ({
    id: `edge-${i}`,
    source: e.source,
    target: e.target,
    label: e.relation,
    animated: e.relation === "extracted_lesson",
  }));

  return { nodes, edges };
}

function mapStatus(
  status: string
): "idle" | "running" | "completed" | "warning" | "failed" {
  switch (status) {
    case "done":
      return "completed";
    case "recalling":
    case "generating":
    case "storing":
      return "running";
    case "error":
      return "failed";
    case "pending":
      return "idle";
    default:
      return "idle";
  }
}

/**
 * Start a run without polling — returns the runId immediately.
 * Use with SSE streaming for live updates.
 */
export async function startRunOnly(payload: {
  title: string;
  description: string;
  project: string;
}): Promise<string> {
  const body = {
    taskDescription: `${payload.title} - ${payload.description}`,
    similarityKey: payload.project,
  };

  const startResp = await fetch(`${BASE}/api/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const startJson = await readJson<{ runId: string }>(startResp);
  return startJson.runId;
}

/**
 * Fetch a completed run and build the full RunResult.
 */
export async function fetchRunResult(runId: string): Promise<RunResult> {
  const r = await fetch(`${BASE}/api/runs/${runId}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const j = await readJson<{ run?: any }>(r);
  const run = j.run;
  if (!run) throw new Error("Run not found");

  const task = {
    taskId: run.id,
    title: run.taskDescription.slice(0, 120),
    description: run.taskDescription,
    project: run.similarityKey,
    similarityKey: run.similarityKey,
    runNumber: run.runNumber,
  };

  const artifacts: AgentArtifact[] = run.steps
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((s: any) => s.artifact)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any) => ({
      artifactId: s.artifact.id,
      taskId: run.id,
      role: s.artifact.agentRole,
      artifactType: s.artifact.artifactType,
      title: s.artifact.title,
      content: s.artifact.content,
      status: s.status ?? "",
      metadata: s.artifact.metadata ?? {},
    }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lessons = (run.evaluation?.lessonsExtracted ?? []).map((l: any) => ({
    artifactId: l.id,
    taskId: run.id,
    role: "shared" as const,
    artifactType: "lesson",
    title: l.category,
    content: l.insight,
    status: "",
    metadata: { source: l.source },
  }));

  const decision = artifacts.find((a) => a.role === "cto") || null;

  const graphResp = await fetch(`${BASE}/api/memory/graph?runId=${run.id}`);
  const rawGraph = await readJson<{
    nodes: Array<{ id: string; label: string; type: string }>;
    edges: Array<{ source: string; target: string; relation: string }>;
  }>(graphResp);
  const graph = transformGraph(rawGraph);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const replay = run.steps.map((s: any) => ({
    id: s.artifact?.id ?? `${run.id}-${s.agentRole}`,
    role: s.agentRole,
    startedAt: s.startedAt,
    finishedAt: s.completedAt,
    summary: s.artifact?.content?.slice(0, 240) ?? "",
    recalledLessonIds: s.recallContext?.filter((c: string) => c) ?? [],
    status: mapStatus(s.status),
  }));

  // Use recallDetails (rich data) if available, fall back to recallContext (titles only)
  const recalledMemory: MemorySnippet[] = run.steps
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((s: any) => (s.recallDetails?.length > 0) || (s.recallContext?.length > 0))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .flatMap((s: any) => {
      // Prefer recallDetails (has actual content)
      if (s.recallDetails?.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return s.recallDetails.map((d: any) => ({
          id: d.id,
          title: d.title || "Recalled item",
          content: d.content || `Recalled by ${s.agentRole} agent.`,
          bucket: d.bucket ?? "knowledge",
          score: d.score,
          role: s.agentRole,
        }));
      }
      // Fallback to recallContext (title strings only)
      return s.recallContext
        .filter((c: string) => c)
        .map((title: string, i: number) => ({
          id: `recall-${s.agentRole}-${i}`,
          title: title || "Recalled item",
          content: `Recalled by ${s.agentRole} agent during task processing.`,
          bucket: i < 3 ? "knowledge" as const : i < 5 ? "roleMemory" as const : "sharedMemory" as const,
          role: s.agentRole,
        }));
    })
    // Deduplicate by id (same item recalled by multiple agents)
    .filter((item: MemorySnippet, idx: number, arr: MemorySnippet[]) =>
      arr.findIndex((other) => other.id === item.id && other.role === item.role) === idx
    );

  return { task, artifacts, lessons, decision, graph, replay, recalledMemory } as RunResult;
}

export { mapStatus, transformGraph };

export async function getLessons() {
  const response = await fetch(`${BASE}/api/lessons`);
  return readJson<{ lessons: AgentArtifact[] }>(response);
}

export async function getGraph(taskId: string) {
  const response = await fetch(
    `${BASE}/api/memory/graph?runId=${encodeURIComponent(taskId)}`
  );
  const rawGraph = await readJson<{
    nodes: Array<{ id: string; label: string; type: string }>;
    edges: Array<{ source: string; target: string; relation: string }>;
  }>(response);
  return transformGraph(rawGraph);
}

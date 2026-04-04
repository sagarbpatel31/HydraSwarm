import type { AgentArtifact, MemorySnippet, RunResult } from "@/lib/types";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function seedDemo() {
  const response = await fetch(`${BASE}/api/seed`, {
    method: "POST",
  });
  return readJson<{ ok: boolean; message?: string }>(response);
}

// Start a run on the backend, poll until complete, and shape the response
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
  const timeoutMs = 120_000; // 2 minutes
  const intervalMs = 1000;
  const startAt = Date.now();
  let run: any | null = null;

  while (Date.now() - startAt < timeoutMs) {
    const r = await fetch(`${BASE}/api/runs/${runId}`);
    const j = await readJson<{ run?: any }>(r);
    run = j.run ?? null;
    if (!run) throw new Error("Run not found");
    if (run.status === "completed" || run.status === "failed") break;
    await new Promise((res) => setTimeout(res, intervalMs));
  }

  if (!run) throw new Error("Run did not complete in time");

  // Build RunResult expected by frontend
  const task = {
    taskId: run.id,
    title: run.taskDescription.slice(0, 120),
    description: run.taskDescription,
    project: run.similarityKey,
    similarityKey: run.similarityKey,
    runNumber: run.runNumber,
  };

  const artifacts: AgentArtifact[] = run.steps
    .filter((s: any) => s.artifact)
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

  const lessons = (run.evaluation?.lessonsExtracted ?? []).map((l: any) => ({
    artifactId: l.id,
    taskId: run.id,
    role: "shared",
    artifactType: "lesson",
    title: l.category,
    content: l.insight,
    status: "",
    metadata: { source: l.source },
  }));

  const decision = artifacts.find((a) => a.role === "cto") || null;

  // Fetch graph from backend
  const graphResp = await fetch(`${BASE}/api/memory/graph?runId=${run.id}`);
  const graph = (await readJson<{ nodes: any[]; edges: any[] }>(graphResp)) || { nodes: [], edges: [] };

  const replay = run.steps.map((s: any) => ({
    id: s.artifact?.id ?? `${run.id}-${s.agentRole}`,
    role: s.agentRole,
    startedAt: s.startedAt,
    finishedAt: s.completedAt,
    summary: s.artifact?.content?.slice(0, 240) ?? "",
    recalledLessonIds: [],
    status: s.status,
  }));

  const recalledMemory: MemorySnippet[] = [];

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

export async function getLessons() {
  const response = await fetch(`${BASE}/api/lessons`);
  return readJson<{ lessons: AgentArtifact[] | MemorySnippet[] }>(response);
}

export async function getGraph(taskId: string) {
  const response = await fetch(`${BASE}/api/memory/graph?runId=${encodeURIComponent(taskId)}`);
  return readJson<RunResult["graph"]>(response);
}

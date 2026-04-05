import { v4 as uuid } from "uuid";
import {
  Run,
  AgentStep,
  Artifact,
  Lesson,
  Evaluation,
  AGENT_ORDER,
  ROLE_ARTIFACT_MAP,
  AgentRole,
} from "@/types/run";
import { MOCK_MODE } from "@/lib/config";
import { agentRecall, storeArtifact, storeLesson, RecallBundle } from "@/lib/hydra";
import { getMockResponse } from "@/lib/mock/responses";
import { getAgent } from "@/lib/agents/registry";
import { buildPrompt } from "@/lib/prompts/system";
import { callClaude } from "@/lib/llm";
import { extractLessons } from "@/lib/workflow/evaluator";

// --- In-memory stores ---

const runs = new Map<string, Run>();
type SSECallback = (event: string, data: unknown) => void;
const listeners = new Map<string, Set<SSECallback>>();

// --- Public API ---

export function getRun(runId: string): Run | undefined {
  return runs.get(runId);
}

export function getAllRuns(): Run[] {
  return Array.from(runs.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function subscribe(runId: string, cb: SSECallback): () => void {
  if (!listeners.has(runId)) {
    listeners.set(runId, new Set());
  }
  listeners.get(runId)!.add(cb);
  return () => {
    listeners.get(runId)?.delete(cb);
  };
}

function emit(runId: string, event: string, data: unknown) {
  listeners.get(runId)?.forEach((cb) => {
    try {
      cb(event, data);
    } catch {
      // ignore listener errors
    }
  });
}

export function startRun(
  taskDescription: string,
  options?: { mock?: boolean; similarityKey?: string }
): string {
  const runId = `run-${uuid().slice(0, 8)}`;
  const useMock = options?.mock ?? MOCK_MODE;

  const steps: AgentStep[] = AGENT_ORDER.map((role) => ({
    agentRole: role,
    status: "pending" as const,
  }));

  const run: Run = {
    id: runId,
    taskDescription,
    similarityKey:
      options?.similarityKey ?? taskDescription.toLowerCase().slice(0, 50),
    status: "queued",
    runNumber: countSimilarRuns(options?.similarityKey ?? taskDescription) + 1,
    steps,
    createdAt: new Date().toISOString(),
  };

  runs.set(runId, run);

  // Fire async — don't await
  executeRun(runId, useMock).catch((err) => {
    console.error(`Run ${runId} failed:`, err);
    const r = runs.get(runId);
    if (r) {
      r.status = "failed";
      emit(runId, "error", { message: String(err) });
    }
  });

  return runId;
}

// --- Private execution ---

async function executeRun(runId: string, useMock: boolean) {
  const run = runs.get(runId)!;
  run.status = "running";
  emit(runId, "run_started", { runId, status: "running" });

  const artifacts: Artifact[] = [];

  for (let i = 0; i < AGENT_ORDER.length; i++) {
    const role = AGENT_ORDER[i];
    const step = run.steps[i];
    const startTime = Date.now();
    step.startedAt = new Date().toISOString();

    try {
      // Step 1: Recall
      step.status = "recalling";
      emit(runId, "step_update", step);

      let recallBundle: RecallBundle = {
        knowledge: [],
        roleMemory: [],
        sharedMemory: [],
      };

      try {
        recallBundle = await agentRecall(role, run.taskDescription);
      } catch (err) {
        console.warn(`Recall failed for ${role}, proceeding without context:`, err);
      }

      step.recallContext = [
        ...recallBundle.knowledge.map((k) => k.title),
        ...recallBundle.roleMemory.map((m) => m.title),
        ...recallBundle.sharedMemory.map((s) => s.title),
      ].filter((t) => t);

      step.recallDetails = [
        ...recallBundle.knowledge.map((k) => ({ id: k.id, title: k.title, content: k.content.slice(0, 200), score: k.score, bucket: "knowledge" as const })),
        ...recallBundle.roleMemory.map((m) => ({ id: m.id, title: m.title, content: m.content.slice(0, 200), score: m.score, bucket: "roleMemory" as const })),
        ...recallBundle.sharedMemory.map((s) => ({ id: s.id, title: s.title, content: s.content.slice(0, 200), score: s.score, bucket: "sharedMemory" as const })),
      ];

      // Step 2: Generate
      step.status = "generating";
      emit(runId, "step_update", step);

      let content: string;

      if (useMock) {
        await delay(800);
        content = getMockResponse(
          role,
          run.taskDescription,
          run.runNumber,
          step.recallContext?.filter((c) => c) ?? []
        );
      } else {
        const prompt = buildPrompt(
          role,
          run.taskDescription,
          recallBundle,
          artifacts
        );
        content = await callClaude(prompt);
      }

      // Step 3: Build artifact
      const artifactType = ROLE_ARTIFACT_MAP[role];
      const agentDef = getAgent(role);
      const artifact: Artifact = {
        id: `${runId}-${role}`,
        runId,
        agentRole: role,
        artifactType,
        title: `${agentDef?.name ?? role}: ${artifactType}`,
        content,
        metadata: {
          run_number: run.runNumber,
          similarity_key: run.similarityKey,
          recalled_items: step.recallContext.length,
          mock: useMock,
        },
        createdAt: new Date().toISOString(),
      };

      // Step 4: Store
      step.status = "storing";
      emit(runId, "step_update", step);

      try {
        await storeArtifact({
          artifactId: artifact.id,
          runId,
          role,
          artifactType,
          title: artifact.title,
          content: artifact.content,
        });
      } catch (err) {
        console.warn(`Store failed for ${role}, continuing:`, err);
      }

      // Done
      step.artifact = artifact;
      step.status = "done";
      step.completedAt = new Date().toISOString();
      step.durationMs = Date.now() - startTime;
      artifacts.push(artifact);
      emit(runId, "step_update", step);
    } catch (err) {
      step.status = "error";
      step.error = err instanceof Error ? err.message : String(err);
      step.completedAt = new Date().toISOString();
      step.durationMs = Date.now() - startTime;
      emit(runId, "step_update", step);
    }
  }

  // Evaluation & lesson extraction
  try {
    const evaluation = await runEvaluation(runId, artifacts, useMock);
    run.evaluation = evaluation;
  } catch (err) {
    console.error("Evaluation failed:", err);
  }

  run.status = "completed";
  run.completedAt = new Date().toISOString();
  emit(runId, "run_complete", run);
}

async function runEvaluation(
  runId: string,
  artifacts: Artifact[],
  useMock: boolean
): Promise<Evaluation> {
  const ctoArtifact = artifacts.find((a) => a.agentRole === "cto");
  const ctoContent = ctoArtifact?.content ?? "";

  // Parse CTO decision
  const approved = /Decision:\s*APPROVED/i.test(ctoContent);
  const scoreMatch = ctoContent.match(/Score:\s*(\d+)/i);
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 7;

  // Extract lessons
  let lessons: Lesson[];
  if (useMock) {
    // Different lessons per run to demonstrate progressive learning
    const runNum = runs.get(runId)?.runNumber ?? 1;
    const lessonSets: Array<Array<{ category: string; insight: string }>> = [
      // Run 1 lessons
      [
        { category: "architecture", insight: "In-memory state for rate limiting must be evaluated for multi-instance correctness. Redis-backed state is required for distributed rate limiters." },
        { category: "reliability", insight: "Audit buffer flush must use exponential backoff with jitter to prevent thundering herd when circuit breaker closes." },
      ],
      // Run 2 lessons (different, building on run 1)
      [
        { category: "process", insight: "Connection pool configurations should be documented explicitly with specific values, not left as 'to be tuned later'." },
        { category: "testing", insight: "Concurrent boundary tests must be included in the CI pipeline to catch race conditions early. Redis-backed state resolved the flaky test from the previous run." },
      ],
      // Run 3+ lessons
      [
        { category: "architecture", insight: "Correlation IDs should be mandatory in all audit events and propagated across service boundaries for end-to-end traceability." },
        { category: "performance", insight: "Rate limit thresholds should be configurable per-route, not global — different endpoints have different traffic patterns and SLAs." },
      ],
    ];
    const setIdx = Math.min(runNum - 1, lessonSets.length - 1);
    lessons = lessonSets[setIdx].map((l, i) => ({
      id: `lesson-${runId}-${i + 1}`,
      category: l.category,
      insight: l.insight,
      source: runId,
      createdAt: new Date().toISOString(),
    }));
  } else {
    lessons = await extractLessons(runId, artifacts);
  }

  // Store lessons to shared memory
  for (const lesson of lessons) {
    try {
      await storeLesson({
        lessonId: lesson.id,
        title: `${lesson.category}: ${lesson.insight.slice(0, 60)}...`,
        content: lesson.insight,
      });
    } catch (err) {
      console.warn("Failed to store lesson:", err);
    }
  }

  return {
    approved,
    score,
    reasoning: ctoContent.slice(0, 500),
    lessonsExtracted: lessons,
  };
}

function countSimilarRuns(key: string): number {
  let count = 0;
  const normalizedKey = key.toLowerCase().slice(0, 50);
  for (const run of runs.values()) {
    if (run.similarityKey === normalizedKey) count++;
  }
  return count;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

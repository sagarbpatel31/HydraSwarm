/* eslint-disable @typescript-eslint/no-explicit-any */
let uuidCounter = 0;
jest.mock("uuid", () => ({
  v4: () => `mock-uuid-${++uuidCounter}`,
}));

const mockAgentRecall = jest.fn();
const mockStoreArtifact = jest.fn();
const mockStoreLesson = jest.fn();
jest.mock("@/lib/hydra", () => ({
  agentRecall: (...args: unknown[]) => mockAgentRecall(...args),
  storeArtifact: (...args: unknown[]) => mockStoreArtifact(...args),
  storeLesson: (...args: unknown[]) => mockStoreLesson(...args),
}));

const mockCallClaude = jest.fn();
jest.mock("@/lib/llm", () => ({
  callClaude: (...args: unknown[]) => mockCallClaude(...args),
}));

const mockExtractLessons = jest.fn();
jest.mock("@/lib/workflow/evaluator", () => ({
  extractLessons: (...args: unknown[]) => mockExtractLessons(...args),
}));

jest.mock("@/lib/config", () => ({
  MOCK_MODE: true,
  TENANT_ID: "hydraswarm",
  LLM_MODEL: "gpt-4o-mini",
  LLM_MAX_TOKENS: 4096,
  LLM_TEMPERATURE: 0.7,
}));

// Mock mode has 800ms delay per agent × 7 agents ≈ 6s+
jest.setTimeout(60000);

import {
  startRun,
  getRun,
  getAllRuns,
  subscribe,
} from "@/lib/workflow/orchestrator";

function waitForRunComplete(runId: string, timeoutMs = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Run timed out")), timeoutMs);
    const check = setInterval(() => {
      const run = getRun(runId);
      if (run && (run.status === "completed" || run.status === "failed")) {
        clearInterval(check);
        clearTimeout(timeout);
        resolve();
      }
    }, 50);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAgentRecall.mockResolvedValue({
    knowledge: [],
    roleMemory: [],
    sharedMemory: [],
  });
  mockStoreArtifact.mockResolvedValue(undefined);
  mockStoreLesson.mockResolvedValue(undefined);
  mockExtractLessons.mockResolvedValue([]);
});

describe("startRun", () => {
  test("returns a runId string", () => {
    const runId = startRun("Test task");
    expect(typeof runId).toBe("string");
    expect(runId).toMatch(/^run-/);
  });

  test("creates a run in queued state", () => {
    const runId = startRun("Test task");
    const run = getRun(runId);
    expect(run).toBeDefined();
    expect(run!.taskDescription).toBe("Test task");
  });

  test("creates 7 pending steps", () => {
    const runId = startRun("Test task");
    const run = getRun(runId);
    expect(run!.steps).toHaveLength(7);
    expect(run!.steps[0].agentRole).toBe("pm");
    expect(run!.steps[6].agentRole).toBe("cto");
  });

  test("uses similarityKey when provided", () => {
    const runId = startRun("Test task", { similarityKey: "rate-limiting" });
    const run = getRun(runId);
    expect(run!.similarityKey).toBe("rate-limiting");
  });

  test("derives similarityKey from task description when not provided", () => {
    const runId = startRun("Add rate limiting to the billing API");
    const run = getRun(runId);
    expect(run!.similarityKey).toBe("add rate limiting to the billing api");
  });
});

describe("getRun", () => {
  test("returns undefined for non-existent run", () => {
    expect(getRun("run-nonexistent")).toBeUndefined();
  });

  test("returns run by ID", () => {
    const runId = startRun("Test");
    const run = getRun(runId);
    expect(run).toBeDefined();
    expect(run!.id).toBe(runId);
  });
});

describe("getAllRuns", () => {
  test("returns an array", () => {
    const runs = getAllRuns();
    expect(Array.isArray(runs)).toBe(true);
  });

  test("includes newly created runs", () => {
    const runId = startRun("Unique task for getAllRuns test");
    const runs = getAllRuns();
    const found = runs.find((r) => r.id === runId);
    expect(found).toBeDefined();
    expect(found!.taskDescription).toBe("Unique task for getAllRuns test");
  });
});

describe("subscribe", () => {
  test("returns an unsubscribe function", () => {
    const runId = startRun("Test");
    const callback = jest.fn();
    const unsub = subscribe(runId, callback);
    expect(typeof unsub).toBe("function");
    unsub();
  });

  test("receives step_update events", async () => {
    const events: Array<{ event: string; data: any }> = [];
    const runId = startRun("Test task");
    subscribe(runId, (event, data) => {
      events.push({ event, data });
    });

    await waitForRunComplete(runId);

    const stepUpdates = events.filter((e) => e.event === "step_update");
    expect(stepUpdates.length).toBeGreaterThan(0);
  });

  test("receives run_complete event when done", async () => {
    const events: Array<{ event: string }> = [];
    const runId = startRun("Test task");
    subscribe(runId, (event) => {
      events.push({ event });
    });

    await waitForRunComplete(runId);

    expect(events.some((e) => e.event === "run_complete")).toBe(true);
  });

  test("unsubscribe stops receiving events", async () => {
    const events: string[] = [];
    const runId = startRun("Test task");
    const unsub = subscribe(runId, (event) => {
      events.push(event);
      // Unsubscribe immediately after first event
      unsub();
    });

    await waitForRunComplete(runId);

    // Should have received at most a few events before unsub
    expect(events.length).toBeLessThan(30);
  });
});

describe("run execution (mock mode)", () => {
  test("completes all 7 steps", async () => {
    const runId = startRun("Test task", { mock: true });
    await waitForRunComplete(runId);

    const run = getRun(runId)!;
    expect(run.status).toBe("completed");
    expect(run.steps.filter((s) => s.status === "done")).toHaveLength(7);
  });

  test("each step has an artifact", async () => {
    const runId = startRun("Test task", { mock: true });
    await waitForRunComplete(runId);

    const run = getRun(runId)!;
    for (const step of run.steps) {
      expect(step.artifact).toBeDefined();
      expect(step.artifact!.content.length).toBeGreaterThan(0);
      expect(step.artifact!.runId).toBe(runId);
    }
  });

  test("each step has timing info", async () => {
    const runId = startRun("Test task", { mock: true });
    await waitForRunComplete(runId);

    const run = getRun(runId)!;
    for (const step of run.steps) {
      expect(step.startedAt).toBeDefined();
      expect(step.completedAt).toBeDefined();
      expect(step.durationMs).toBeGreaterThan(0);
    }
  });

  test("calls agentRecall for each step", async () => {
    const runId = startRun("Test task", { mock: true });
    await waitForRunComplete(runId);

    // 7 agents = 7 recall calls
    expect(mockAgentRecall).toHaveBeenCalledTimes(7);
  });

  test("calls storeArtifact for each step", async () => {
    const runId = startRun("Test task", { mock: true });
    await waitForRunComplete(runId);

    expect(mockStoreArtifact).toHaveBeenCalledTimes(7);
  });

  test("continues when recall fails", async () => {
    mockAgentRecall.mockRejectedValue(new Error("HydraDB down"));
    const runId = startRun("Test task", { mock: true });
    await waitForRunComplete(runId);

    const run = getRun(runId)!;
    expect(run.status).toBe("completed");
    // Steps still complete with empty recall
    expect(run.steps.filter((s) => s.status === "done")).toHaveLength(7);
  });

  test("continues when store fails", async () => {
    mockStoreArtifact.mockRejectedValue(new Error("storage error"));
    const runId = startRun("Test task", { mock: true });
    await waitForRunComplete(runId);

    const run = getRun(runId)!;
    expect(run.status).toBe("completed");
    expect(run.steps.filter((s) => s.status === "done")).toHaveLength(7);
  });

  test("has evaluation after completion", async () => {
    const runId = startRun("Test task", { mock: true });
    await waitForRunComplete(runId);

    const run = getRun(runId)!;
    expect(run.evaluation).toBeDefined();
    expect(typeof run.evaluation!.score).toBe("number");
    expect(typeof run.evaluation!.approved).toBe("boolean");
  });

  test("mock evaluation extracts lessons", async () => {
    const runId = startRun("Test task", { mock: true });
    await waitForRunComplete(runId);

    const run = getRun(runId)!;
    expect(run.evaluation!.lessonsExtracted.length).toBeGreaterThanOrEqual(2);
    // Each lesson should have category and insight
    for (const lesson of run.evaluation!.lessonsExtracted) {
      expect(lesson.category).toBeTruthy();
      expect(lesson.insight).toBeTruthy();
      expect(lesson.source).toBe(runId);
    }
  });

  test("stores lessons to shared memory", async () => {
    const runId = startRun("Test task", { mock: true });
    await waitForRunComplete(runId);

    expect(mockStoreLesson.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  test("run has completedAt timestamp", async () => {
    const runId = startRun("Test task", { mock: true });
    await waitForRunComplete(runId);

    const run = getRun(runId)!;
    expect(run.completedAt).toBeDefined();
  });

  test("runNumber increments for similar tasks", async () => {
    const key = "test-similarity-key-unique";
    const runId1 = startRun("Task A", { mock: true, similarityKey: key });
    await waitForRunComplete(runId1);
    const run1 = getRun(runId1)!;

    const runId2 = startRun("Task B", { mock: true, similarityKey: key });
    const run2 = getRun(runId2)!;
    expect(run2.runNumber).toBe(run1.runNumber + 1);
  });

  test("CTO decision is parsed from mock content", async () => {
    const runId = startRun("Test task", { mock: true });
    await waitForRunComplete(runId);

    const run = getRun(runId)!;
    expect(run.evaluation!.approved).toBe(true);
    expect(run.evaluation!.score).toBe(7);
  });
});

const mockEnsureTenant = jest.fn();
const mockUploadKnowledge = jest.fn();
const mockAddAgentMemory = jest.fn();
const mockAddSharedMemory = jest.fn();

jest.mock("@/lib/hydra", () => ({
  ensureTenant: (...args: unknown[]) => mockEnsureTenant(...args),
  uploadKnowledge: (...args: unknown[]) => mockUploadKnowledge(...args),
  addAgentMemory: (...args: unknown[]) => mockAddAgentMemory(...args),
  addSharedMemory: (...args: unknown[]) => mockAddSharedMemory(...args),
}));

import { runSeed } from "@/lib/seed";
import { SEED_KNOWLEDGE } from "@/lib/seed/knowledge";
import { SEED_AGENT_MEMORIES, SEED_SHARED_MEMORIES } from "@/lib/seed/memories";

beforeEach(() => {
  jest.clearAllMocks();
  mockEnsureTenant.mockResolvedValue(undefined);
  mockUploadKnowledge.mockResolvedValue(undefined);
  mockAddAgentMemory.mockResolvedValue(undefined);
  mockAddSharedMemory.mockResolvedValue(undefined);
});

describe("seed data constants", () => {
  test("has 5 knowledge documents", () => {
    expect(SEED_KNOWLEDGE).toHaveLength(5);
  });

  test("each knowledge doc has filename, content, metadata", () => {
    for (const doc of SEED_KNOWLEDGE) {
      expect(doc.filename).toBeTruthy();
      expect(doc.filename).toMatch(/\.md$/);
      expect(doc.content.length).toBeGreaterThan(100);
      expect(doc.metadata).toBeDefined();
    }
  });

  test("has 14 agent memories", () => {
    expect(SEED_AGENT_MEMORIES).toHaveLength(14);
  });

  test("agent memories cover all 7 roles", () => {
    const roles = new Set(SEED_AGENT_MEMORIES.map((m) => m.role));
    expect(roles.size).toBe(7);
    expect(roles).toContain("pm");
    expect(roles).toContain("architect");
    expect(roles).toContain("developer");
    expect(roles).toContain("reviewer");
    expect(roles).toContain("qa");
    expect(roles).toContain("sre");
    expect(roles).toContain("cto");
  });

  test("each agent memory has 2 entries per role", () => {
    const roleCounts = new Map<string, number>();
    for (const m of SEED_AGENT_MEMORIES) {
      roleCounts.set(m.role, (roleCounts.get(m.role) ?? 0) + 1);
    }
    for (const [, count] of roleCounts) {
      expect(count).toBe(2);
    }
  });

  test("has 3 shared memories", () => {
    expect(SEED_SHARED_MEMORIES).toHaveLength(3);
  });

  test("shared memories have title and text", () => {
    for (const m of SEED_SHARED_MEMORIES) {
      expect(m.title).toBeTruthy();
      expect(m.text.length).toBeGreaterThan(50);
    }
  });

  test("knowledge includes postmortem document", () => {
    const postmortem = SEED_KNOWLEDGE.find((k) =>
      k.filename.includes("postmortem")
    );
    expect(postmortem).toBeDefined();
    expect(postmortem!.content).toContain("circuit breaker");
  });

  test("knowledge includes engineering standards", () => {
    const standards = SEED_KNOWLEDGE.find((k) =>
      k.filename.includes("engineering-standards")
    );
    expect(standards).toBeDefined();
    expect(standards!.content).toContain("80%");
  });
});

describe("runSeed", () => {
  test("calls ensureTenant first", async () => {
    await runSeed();
    expect(mockEnsureTenant).toHaveBeenCalledTimes(1);
  });

  test("uploads all 5 knowledge docs", async () => {
    const result = await runSeed();
    expect(mockUploadKnowledge).toHaveBeenCalledTimes(5);
    expect(result.knowledgeCount).toBe(5);
  });

  test("stores all 14 agent memories", async () => {
    const result = await runSeed();
    expect(mockAddAgentMemory).toHaveBeenCalledTimes(14);
    expect(result.memoryCount).toBe(14);
  });

  test("stores all 3 shared memories", async () => {
    const result = await runSeed();
    expect(mockAddSharedMemory).toHaveBeenCalledTimes(3);
    expect(result.sharedCount).toBe(3);
  });

  test("returns success=true when no errors", async () => {
    const result = await runSeed();
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("continues on knowledge upload failure", async () => {
    mockUploadKnowledge
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("upload fail"))
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    const result = await runSeed();
    expect(result.knowledgeCount).toBe(4);
    expect(result.errors).toHaveLength(1);
    expect(result.success).toBe(false);
  });

  test("continues on agent memory failure", async () => {
    mockAddAgentMemory
      .mockResolvedValue(undefined)
      .mockRejectedValueOnce(new Error("memory fail"));

    const result = await runSeed();
    expect(result.memoryCount).toBe(13);
    expect(result.errors).toHaveLength(1);
  });

  test("continues on shared memory failure", async () => {
    mockAddSharedMemory
      .mockResolvedValue(undefined)
      .mockRejectedValueOnce(new Error("shared fail"));

    const result = await runSeed();
    expect(result.sharedCount).toBe(2);
    expect(result.errors).toHaveLength(1);
  });

  test("collects multiple errors across categories", async () => {
    mockUploadKnowledge.mockRejectedValue(new Error("fail"));
    mockAddAgentMemory.mockRejectedValue(new Error("fail"));
    mockAddSharedMemory.mockRejectedValue(new Error("fail"));

    const result = await runSeed();
    expect(result.success).toBe(false);
    expect(result.knowledgeCount).toBe(0);
    expect(result.memoryCount).toBe(0);
    expect(result.sharedCount).toBe(0);
    expect(result.errors.length).toBe(5 + 14 + 3);
  });

  test("passes correct metadata to knowledge uploads", async () => {
    await runSeed();
    const firstCall = mockUploadKnowledge.mock.calls[0][0];
    expect(firstCall.filename).toMatch(/\.md$/);
    expect(firstCall.content).toBeTruthy();
    expect(firstCall.metadata).toBeDefined();
  });

  test("passes role and text to agent memory", async () => {
    await runSeed();
    const firstCall = mockAddAgentMemory.mock.calls[0][0];
    expect(firstCall.role).toBeTruthy();
    expect(firstCall.text).toBeTruthy();
    expect(firstCall.title).toBeTruthy();
  });
});

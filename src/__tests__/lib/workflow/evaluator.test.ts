const mockCallClaude = jest.fn();
jest.mock("@/lib/llm", () => ({
  callClaude: (...args: unknown[]) => mockCallClaude(...args),
}));

jest.mock("uuid", () => ({
  v4: jest.fn().mockReturnValue("test-uuid-1234"),
}));

import { extractLessons } from "@/lib/workflow/evaluator";
import { Artifact } from "@/types/run";

const sampleArtifacts: Artifact[] = [
  {
    id: "run-001-pm",
    runId: "run-001",
    agentRole: "pm",
    artifactType: "prd",
    title: "PM PRD",
    content: "# PRD\n## Goals\n- Add rate limiting",
    metadata: {},
    createdAt: "2026-04-04T10:00:00Z",
  },
  {
    id: "run-001-cto",
    runId: "run-001",
    agentRole: "cto",
    artifactType: "cto_decision",
    title: "CTO Decision",
    content: "# Decision: APPROVED\n## Score: 8\nLooks good overall.",
    metadata: {},
    createdAt: "2026-04-04T10:05:00Z",
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe("extractLessons", () => {
  test("parses valid JSON array from LLM response", async () => {
    mockCallClaude.mockResolvedValue(
      JSON.stringify([
        { category: "architecture", insight: "Use circuit breakers" },
        { category: "testing", insight: "Test edge cases" },
      ])
    );
    const lessons = await extractLessons("run-001", sampleArtifacts);
    expect(lessons).toHaveLength(2);
    expect(lessons[0].category).toBe("architecture");
    expect(lessons[0].insight).toBe("Use circuit breakers");
    expect(lessons[0].source).toBe("run-001");
    expect(lessons[0].id).toBeDefined();
  });

  test("handles JSON wrapped in markdown code blocks", async () => {
    mockCallClaude.mockResolvedValue(
      '```json\n[{"category": "reliability", "insight": "Add monitoring"}]\n```'
    );
    const lessons = await extractLessons("run-001", sampleArtifacts);
    expect(lessons).toHaveLength(1);
    expect(lessons[0].category).toBe("reliability");
  });

  test("limits to maximum 3 lessons", async () => {
    mockCallClaude.mockResolvedValue(
      JSON.stringify([
        { category: "a", insight: "1" },
        { category: "b", insight: "2" },
        { category: "c", insight: "3" },
        { category: "d", insight: "4" },
        { category: "e", insight: "5" },
      ])
    );
    const lessons = await extractLessons("run-001", sampleArtifacts);
    expect(lessons).toHaveLength(3);
  });

  test("returns fallback lesson on JSON parse failure", async () => {
    mockCallClaude.mockResolvedValue("This is not valid JSON at all");
    const lessons = await extractLessons("run-001", sampleArtifacts);
    expect(lessons).toHaveLength(1);
    expect(lessons[0].category).toBe("process");
    expect(lessons[0].insight).toContain("failed");
  });

  test("returns fallback lesson on LLM error", async () => {
    mockCallClaude.mockRejectedValue(new Error("API timeout"));
    const lessons = await extractLessons("run-001", sampleArtifacts);
    expect(lessons).toHaveLength(1);
    expect(lessons[0].insight).toContain("failed");
  });

  test("handles missing category/insight fields", async () => {
    mockCallClaude.mockResolvedValue(JSON.stringify([{ other: "field" }]));
    const lessons = await extractLessons("run-001", sampleArtifacts);
    expect(lessons).toHaveLength(1);
    expect(lessons[0].category).toBe("process");
    expect(lessons[0].insight).toBe("No insight extracted");
  });

  test("handles non-array JSON response", async () => {
    mockCallClaude.mockResolvedValue(JSON.stringify({ not: "an array" }));
    const lessons = await extractLessons("run-001", sampleArtifacts);
    expect(lessons).toEqual([]);
  });

  test("each lesson has createdAt timestamp", async () => {
    mockCallClaude.mockResolvedValue(
      JSON.stringify([{ category: "testing", insight: "Test more" }])
    );
    const lessons = await extractLessons("run-001", sampleArtifacts);
    expect(lessons[0].createdAt).toBeDefined();
    expect(new Date(lessons[0].createdAt).getTime()).not.toBeNaN();
  });

  test("passes artifact summaries to LLM prompt", async () => {
    mockCallClaude.mockResolvedValue("[]");
    await extractLessons("run-001", sampleArtifacts);
    const prompt = mockCallClaude.mock.calls[0][0];
    expect(prompt).toContain("pm");
    expect(prompt).toContain("cto");
    expect(prompt).toContain("retrospective analyst");
  });

  test("uses low temperature for lesson extraction", async () => {
    mockCallClaude.mockResolvedValue("[]");
    await extractLessons("run-001", sampleArtifacts);
    const options = mockCallClaude.mock.calls[0][1];
    expect(options.temperature).toBe(0.3);
  });
});

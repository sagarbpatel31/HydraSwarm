/* eslint-disable @typescript-eslint/no-explicit-any */
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { seedDemo, getLessons, startRunOnly, getGraph } from "@/lib/api";

beforeEach(() => { jest.clearAllMocks(); });

function mockResponse(data: unknown, ok = true, status = 200) {
  return { ok, status, json: () => Promise.resolve(data), text: () => Promise.resolve(JSON.stringify(data)) };
}

describe("seedDemo", () => {
  test("calls POST /api/seed", async () => {
    mockFetch.mockResolvedValue(mockResponse({ success: true, knowledgeCount: 5, memoryCount: 14, sharedCount: 3, errors: [] }));
    await seedDemo();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/seed"), expect.objectContaining({ method: "POST" }));
  });

  test("maps success response correctly", async () => {
    mockFetch.mockResolvedValue(mockResponse({ success: true, knowledgeCount: 5, memoryCount: 14, sharedCount: 3, errors: [] }));
    const result = await seedDemo();
    expect(result.ok).toBe(true);
    expect(result.message).toContain("5 knowledge docs");
    expect(result.message).toContain("14 agent memories");
    expect(result.message).toContain("3 shared lessons");
  });

  test("maps partial failure response", async () => {
    mockFetch.mockResolvedValue(mockResponse({ success: false, knowledgeCount: 3, memoryCount: 10, sharedCount: 2, errors: ["fail1", "fail2"] }));
    const result = await seedDemo();
    expect(result.ok).toBe(false);
    expect(result.message).toContain("2 errors");
  });

  test("throws on non-ok response", async () => {
    mockFetch.mockResolvedValue(mockResponse("Server error", false, 500));
    await expect(seedDemo()).rejects.toThrow();
  });
});

describe("getLessons", () => {
  test("calls GET /api/lessons", async () => {
    mockFetch.mockResolvedValue(mockResponse({ lessons: [] }));
    await getLessons();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/lessons"));
  });

  test("returns lessons from response", async () => {
    mockFetch.mockResolvedValue(mockResponse({ lessons: [{ artifactId: "l1" }] }));
    const result = await getLessons();
    expect(result.lessons).toHaveLength(1);
  });
});

describe("startRunOnly", () => {
  test("calls POST /api/runs with correct body", async () => {
    mockFetch.mockResolvedValue(mockResponse({ runId: "run-abc" }));
    const runId = await startRunOnly({ title: "Test task", description: "Details", project: "proj" });
    expect(runId).toBe("run-abc");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/runs"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  test("combines title and description in taskDescription", async () => {
    mockFetch.mockResolvedValue(mockResponse({ runId: "run-abc" }));
    await startRunOnly({ title: "My Title", description: "My Desc", project: "proj" });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.taskDescription).toBe("My Title - My Desc");
    expect(body.similarityKey).toBe("proj");
  });

  test("throws on error response", async () => {
    mockFetch.mockResolvedValue(mockResponse("Bad request", false, 400));
    await expect(startRunOnly({ title: "t", description: "d", project: "p" })).rejects.toThrow();
  });
});

describe("getGraph", () => {
  test("calls correct URL with encoded taskId", async () => {
    mockFetch.mockResolvedValue(mockResponse({ nodes: [], edges: [] }));
    await getGraph("task with spaces");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("task%20with%20spaces"));
  });

  test("transforms nodes with horizontal positions", async () => {
    mockFetch.mockResolvedValue(mockResponse({
      nodes: [
        { id: "n1", label: "Task", type: "task" },
        { id: "n2", label: "PM", type: "pm" },
      ],
      edges: [{ source: "n1", target: "n2", relation: "produces" }],
    }));
    const result = await getGraph("task-001");
    expect(result.nodes).toHaveLength(2);
    // Horizontal layout: x increases, y stays at 40
    expect(result.nodes[0].position.x).toBe(0);
    expect(result.nodes[0].position.y).toBe(40);
    expect(result.nodes[1].position.x).toBe(160);
  });

  test("positions lesson nodes below agents", async () => {
    mockFetch.mockResolvedValue(mockResponse({
      nodes: [
        { id: "n1", label: "CTO", type: "cto" },
        { id: "n2", label: "Lesson", type: "lesson" },
      ],
      edges: [],
    }));
    const result = await getGraph("task-001");
    const lesson = result.nodes.find((n: any) => n.data.nodeType === "lesson");
    expect(lesson?.position.y).toBe(180); // Below agent row
  });

  test("marks lesson edges as animated", async () => {
    mockFetch.mockResolvedValue(mockResponse({
      nodes: [{ id: "n1", label: "A", type: "cto" }, { id: "n2", label: "B", type: "lesson" }],
      edges: [{ source: "n1", target: "n2", relation: "extracted_lesson" }],
    }));
    const result = await getGraph("task-001");
    expect(result.edges[0].animated).toBe(true);
  });

  test("non-lesson edges are not animated", async () => {
    mockFetch.mockResolvedValue(mockResponse({
      nodes: [{ id: "n1", label: "A", type: "pm" }, { id: "n2", label: "B", type: "architect" }],
      edges: [{ source: "n1", target: "n2", relation: "produces" }],
    }));
    const result = await getGraph("task-001");
    expect(result.edges[0].animated).toBe(false);
  });
});

describe("error handling", () => {
  test("throws descriptive error on 404", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, text: () => Promise.resolve("Not found") });
    await expect(seedDemo()).rejects.toThrow("Not found");
  });

  test("throws with status code when no message", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve("") });
    await expect(seedDemo()).rejects.toThrow("500");
  });
});

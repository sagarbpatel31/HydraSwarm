/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { seedDemo, getLessons } from "@/lib/api";

beforeEach(() => {
  jest.clearAllMocks();
});

function mockResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

describe("seedDemo", () => {
  test("calls POST /api/seed", async () => {
    mockFetch.mockResolvedValue(
      mockResponse({
        success: true,
        knowledgeCount: 5,
        memoryCount: 14,
        sharedCount: 3,
        errors: [],
      })
    );

    await seedDemo();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/seed"),
      expect.objectContaining({ method: "POST" })
    );
  });

  test("maps success response correctly", async () => {
    mockFetch.mockResolvedValue(
      mockResponse({
        success: true,
        knowledgeCount: 5,
        memoryCount: 14,
        sharedCount: 3,
        errors: [],
      })
    );

    const result = await seedDemo();
    expect(result.ok).toBe(true);
    expect(result.message).toContain("5 knowledge docs");
    expect(result.message).toContain("14 agent memories");
    expect(result.message).toContain("3 shared lessons");
  });

  test("maps partial failure response", async () => {
    mockFetch.mockResolvedValue(
      mockResponse({
        success: false,
        knowledgeCount: 3,
        memoryCount: 10,
        sharedCount: 2,
        errors: ["upload failed", "memory failed"],
      })
    );

    const result = await seedDemo();
    expect(result.ok).toBe(false);
    expect(result.message).toContain("2 errors");
    expect(result.message).toContain("3 docs");
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
    const lessons = [
      { artifactId: "l1", title: "architecture", content: "Use circuit breakers" },
    ];
    mockFetch.mockResolvedValue(mockResponse({ lessons }));
    const result = await getLessons();
    expect(result.lessons).toHaveLength(1);
  });
});

// Test the private helper functions via their public callers
describe("API error handling", () => {
  test("throws descriptive error on 404", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve("Not found"),
    });
    await expect(seedDemo()).rejects.toThrow("Not found");
  });

  test("throws with status code when no message", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve(""),
    });
    await expect(seedDemo()).rejects.toThrow("500");
  });
});

// Test transformGraph and mapStatus through their module
describe("transformGraph (via import)", () => {
  // We can test these through getGraph
  test("getGraph calls correct URL with encoded taskId", async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ nodes: [], edges: [] })
    );
    const { getGraph } = await import("@/lib/api");
    await getGraph("task with spaces");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("task%20with%20spaces")
    );
  });

  test("getGraph transforms nodes with positions", async () => {
    mockFetch.mockResolvedValue(
      mockResponse({
        nodes: [
          { id: "n1", label: "Task", type: "task" },
          { id: "n2", label: "PM", type: "pm" },
        ],
        edges: [{ source: "n1", target: "n2", relation: "produces" }],
      })
    );
    const { getGraph } = await import("@/lib/api");
    const result = await getGraph("task-001");
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0].position).toEqual({ x: 50, y: 0 });
    expect(result.nodes[1].position).toEqual({ x: 50, y: 100 });
    expect(result.nodes[0].data.label).toBe("Task");
  });

  test("getGraph marks lesson edges as animated", async () => {
    mockFetch.mockResolvedValue(
      mockResponse({
        nodes: [
          { id: "n1", label: "CTO", type: "cto" },
          { id: "n2", label: "Lesson", type: "lesson" },
        ],
        edges: [{ source: "n1", target: "n2", relation: "extracted_lesson" }],
      })
    );
    const { getGraph } = await import("@/lib/api");
    const result = await getGraph("task-001");
    expect(result.edges[0].animated).toBe(true);
  });

  test("non-lesson edges are not animated", async () => {
    mockFetch.mockResolvedValue(
      mockResponse({
        nodes: [
          { id: "n1", label: "PM", type: "pm" },
          { id: "n2", label: "Arch", type: "architect" },
        ],
        edges: [{ source: "n1", target: "n2", relation: "produces" }],
      })
    );
    const { getGraph } = await import("@/lib/api");
    const result = await getGraph("task-001");
    expect(result.edges[0].animated).toBe(false);
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockTenantCreate = jest.fn();
const mockGetInfraStatus = jest.fn();
const mockUploadKnowledge = jest.fn();
const mockAddMemory = jest.fn();
const mockFullRecall = jest.fn();
const mockRecallPreferences = jest.fn();
const mockGraphRelations = jest.fn();

jest.mock("@hydra_db/node", () => ({
  HydraDBClient: jest.fn().mockImplementation(() => ({
    tenant: {
      create: mockTenantCreate,
      getInfraStatus: mockGetInfraStatus,
    },
    upload: {
      knowledge: mockUploadKnowledge,
      addMemory: mockAddMemory,
    },
    recall: {
      fullRecall: mockFullRecall,
      recallPreferences: mockRecallPreferences,
    },
    fetch: {
      graphRelationsBySourceId: mockGraphRelations,
    },
  })),
}));

import {
  ensureTenant,
  checkConnection,
  uploadKnowledge,
  addAgentMemory,
  addSharedMemory,
  recallKnowledge,
  recallAgentMemory,
  recallSharedMemory,
  agentRecall,
  storeArtifact,
  storeLesson,
  getGraphRelations,
} from "@/lib/hydra";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ensureTenant", () => {
  test("calls tenant.create with hydraswarm tenant id", async () => {
    mockTenantCreate.mockResolvedValue({});
    await ensureTenant();
    expect(mockTenantCreate).toHaveBeenCalledWith({ tenant_id: "hydraswarm" });
  });

  test("swallows 'already exists' errors", async () => {
    mockTenantCreate.mockRejectedValue(new Error("already exists"));
    await expect(ensureTenant()).resolves.toBeUndefined();
  });

  test("swallows 409 conflict errors", async () => {
    mockTenantCreate.mockRejectedValue(new Error("409 Conflict"));
    await expect(ensureTenant()).resolves.toBeUndefined();
  });

  test("rethrows non-exists errors", async () => {
    mockTenantCreate.mockRejectedValue(new Error("network failure"));
    await expect(ensureTenant()).rejects.toThrow("network failure");
  });
});

describe("checkConnection", () => {
  test("returns true when infra status succeeds", async () => {
    mockGetInfraStatus.mockResolvedValue({});
    const result = await checkConnection();
    expect(result).toBe(true);
  });

  test("tries ensureTenant as fallback", async () => {
    mockGetInfraStatus.mockRejectedValue(new Error("not found"));
    mockTenantCreate.mockResolvedValue({});
    const result = await checkConnection();
    expect(result).toBe(true);
  });

  test("returns false when both fail", async () => {
    mockGetInfraStatus.mockRejectedValue(new Error("fail"));
    mockTenantCreate.mockRejectedValue(new Error("fail"));
    const result = await checkConnection();
    expect(result).toBe(false);
  });
});

describe("uploadKnowledge", () => {
  test("calls upload.knowledge with File and tenant_id", async () => {
    mockUploadKnowledge.mockResolvedValue({});
    await uploadKnowledge({
      content: "# Test Doc\nSome content",
      filename: "test-doc.md",
    });
    expect(mockUploadKnowledge).toHaveBeenCalledTimes(1);
    const call = mockUploadKnowledge.mock.calls[0][0];
    expect(call.tenant_id).toBe("hydraswarm");
    expect(call.upsert).toBe(true);
    expect(call.files).toHaveLength(1);
    expect(call.files[0]).toBeInstanceOf(File);
    expect(call.files[0].name).toBe("test-doc.md");
  });

  test("includes metadata when provided", async () => {
    mockUploadKnowledge.mockResolvedValue({});
    await uploadKnowledge({
      content: "content",
      filename: "test.md",
      metadata: { category: "guide" },
    });
    const call = mockUploadKnowledge.mock.calls[0][0];
    expect(call.file_metadata).toBeDefined();
    const parsed = JSON.parse(call.file_metadata);
    expect(parsed[0].metadata.category).toBe("guide");
  });
});

describe("addAgentMemory", () => {
  test("uses agent-{role} sub_tenant_id", async () => {
    mockAddMemory.mockResolvedValue({});
    await addAgentMemory({ role: "pm", text: "test memory", title: "Test" });
    const call = mockAddMemory.mock.calls[0][0];
    expect(call.tenant_id).toBe("hydraswarm");
    expect(call.sub_tenant_id).toBe("agent-pm");
    expect(call.upsert).toBe(true);
    expect(call.memories[0].text).toBe("test memory");
    expect(call.memories[0].is_markdown).toBe(true);
    expect(call.memories[0].infer).toBe(true);
  });

  test("routes different roles to different sub-tenants", async () => {
    mockAddMemory.mockResolvedValue({});
    await addAgentMemory({ role: "architect", text: "test" });
    expect(mockAddMemory.mock.calls[0][0].sub_tenant_id).toBe("agent-architect");

    await addAgentMemory({ role: "cto", text: "test" });
    expect(mockAddMemory.mock.calls[1][0].sub_tenant_id).toBe("agent-cto");
  });
});

describe("addSharedMemory", () => {
  test("uses 'shared' sub_tenant_id", async () => {
    mockAddMemory.mockResolvedValue({});
    await addSharedMemory({ text: "org lesson", title: "Lesson" });
    const call = mockAddMemory.mock.calls[0][0];
    expect(call.sub_tenant_id).toBe("shared");
    expect(call.memories[0].text).toBe("org lesson");
  });
});

describe("recallKnowledge", () => {
  test("normalizes chunks to RecallItem[]", async () => {
    mockFullRecall.mockResolvedValue({
      chunks: [
        {
          chunk_uuid: "c1",
          source_id: "s1",
          chunk_content: "Some knowledge content",
          source_title: "API Guide",
          source_type: "file",
          relevancy_score: 0.92,
          document_metadata: { category: "guide" },
        },
      ],
    });
    const results = await recallKnowledge("rate limiting");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("c1");
    expect(results[0].title).toBe("API Guide");
    expect(results[0].content).toBe("Some knowledge content");
    expect(results[0].score).toBe(0.92);
  });

  test("returns empty array when no chunks", async () => {
    mockFullRecall.mockResolvedValue({});
    const results = await recallKnowledge("nothing");
    expect(results).toEqual([]);
  });

  test("handles missing fields gracefully", async () => {
    mockFullRecall.mockResolvedValue({
      chunks: [
        {
          chunk_content: "content only",
        },
      ],
    });
    const results = await recallKnowledge("test");
    expect(results).toHaveLength(1);
    expect(results[0].content).toBe("content only");
    expect(results[0].score).toBe(0);
  });

  test("passes alpha and recency_bias parameters", async () => {
    mockFullRecall.mockResolvedValue({ chunks: [] });
    await recallKnowledge("test");
    const call = mockFullRecall.mock.calls[0][0];
    expect(call.alpha).toBe(0.7);
    expect(call.recency_bias).toBe(0.3);
    expect(call.graph_context).toBe(true);
  });
});

describe("recallAgentMemory", () => {
  test("uses correct sub-tenant for role", async () => {
    mockRecallPreferences.mockResolvedValue({ chunks: [] });
    await recallAgentMemory("reviewer", "test query");
    const call = mockRecallPreferences.mock.calls[0][0];
    expect(call.sub_tenant_id).toBe("agent-reviewer");
  });
});

describe("recallSharedMemory", () => {
  test("uses 'shared' sub-tenant", async () => {
    mockRecallPreferences.mockResolvedValue({ chunks: [] });
    await recallSharedMemory("test query");
    const call = mockRecallPreferences.mock.calls[0][0];
    expect(call.sub_tenant_id).toBe("shared");
  });
});

describe("agentRecall", () => {
  test("runs 3 recall types in parallel", async () => {
    mockFullRecall.mockResolvedValue({
      chunks: [{ chunk_uuid: "k1", chunk_content: "knowledge", source_title: "Doc" }],
    });
    mockRecallPreferences.mockResolvedValue({
      chunks: [{ chunk_uuid: "m1", chunk_content: "memory", source_title: "Mem" }],
    });

    const result = await agentRecall("pm", "test");
    expect(result.knowledge).toHaveLength(1);
    expect(result.roleMemory).toHaveLength(1);
    expect(result.sharedMemory).toHaveLength(1);
  });

  test("handles partial failures gracefully", async () => {
    mockFullRecall.mockRejectedValue(new Error("knowledge fail"));
    mockRecallPreferences
      .mockResolvedValueOnce({ chunks: [{ chunk_uuid: "m1", chunk_content: "memory", source_title: "Mem" }] })
      .mockRejectedValueOnce(new Error("shared fail"));

    const result = await agentRecall("pm", "test");
    expect(result.knowledge).toEqual([]);
    expect(result.roleMemory).toHaveLength(1);
    expect(result.sharedMemory).toEqual([]);
  });

  test("returns empty arrays when all fail", async () => {
    mockFullRecall.mockRejectedValue(new Error("fail"));
    mockRecallPreferences.mockRejectedValue(new Error("fail"));

    const result = await agentRecall("pm", "test");
    expect(result.knowledge).toEqual([]);
    expect(result.roleMemory).toEqual([]);
    expect(result.sharedMemory).toEqual([]);
  });
});

describe("storeArtifact", () => {
  test("calls both uploadKnowledge and addAgentMemory", async () => {
    mockUploadKnowledge.mockResolvedValue({});
    mockAddMemory.mockResolvedValue({});

    await storeArtifact({
      artifactId: "run-001-pm",
      runId: "run-001",
      role: "pm",
      artifactType: "prd",
      title: "PM PRD",
      content: "# Requirements\nLong content here...",
    });

    expect(mockUploadKnowledge).toHaveBeenCalledTimes(1);
    expect(mockAddMemory).toHaveBeenCalledTimes(1);
  });

  test("does not fail if uploadKnowledge fails", async () => {
    mockUploadKnowledge.mockRejectedValue(new Error("upload fail"));
    mockAddMemory.mockResolvedValue({});

    await expect(
      storeArtifact({
        artifactId: "run-001-pm",
        runId: "run-001",
        role: "pm",
        artifactType: "prd",
        title: "Test",
        content: "content",
      })
    ).resolves.toBeUndefined();
  });

  test("does not fail if addMemory fails", async () => {
    mockUploadKnowledge.mockResolvedValue({});
    mockAddMemory.mockRejectedValue(new Error("memory fail"));

    await expect(
      storeArtifact({
        artifactId: "run-001-pm",
        runId: "run-001",
        role: "pm",
        artifactType: "prd",
        title: "Test",
        content: "content",
      })
    ).resolves.toBeUndefined();
  });
});

describe("storeLesson", () => {
  test("stores as shared memory with [LESSON] prefix", async () => {
    mockAddMemory.mockResolvedValue({});
    await storeLesson({
      lessonId: "lesson-001",
      title: "Circuit breaker lesson",
      content: "Always add circuit breakers",
    });
    const call = mockAddMemory.mock.calls[0][0];
    expect(call.sub_tenant_id).toBe("shared");
    expect(call.memories[0].text).toContain("[LESSON]");
    expect(call.memories[0].text).toContain("Circuit breaker lesson");
    expect(call.memories[0].text).toContain("Always add circuit breakers");
  });
});

describe("getGraphRelations", () => {
  test("returns empty graph on error", async () => {
    mockGraphRelations.mockRejectedValue(new Error("not found"));
    const result = await getGraphRelations("source-123");
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  test("transforms triplets into nodes and edges", async () => {
    mockGraphRelations.mockResolvedValue({
      relations: [
        {
          triplets: [
            { subject: "RateLimiter", predicate: "uses", object: "TokenBucket" },
            { subject: "AuditLogger", predicate: "writes_to", object: "PostgreSQL" },
          ],
        },
      ],
    });
    const result = await getGraphRelations("source-123");
    expect(result.nodes).toHaveLength(4);
    expect(result.edges).toHaveLength(2);
    expect(result.edges[0]).toEqual({
      source: "RateLimiter",
      target: "TokenBucket",
      relation: "uses",
    });
  });

  test("deduplicates nodes", async () => {
    mockGraphRelations.mockResolvedValue({
      relations: [
        {
          triplets: [
            { subject: "A", predicate: "rel1", object: "B" },
            { subject: "A", predicate: "rel2", object: "C" },
          ],
        },
      ],
    });
    const result = await getGraphRelations("source-123");
    // A appears twice as subject but should be one node
    const aNodes = result.nodes.filter((n: any) => n.id === "A");
    expect(aNodes).toHaveLength(1);
    expect(result.nodes).toHaveLength(3); // A, B, C
    expect(result.edges).toHaveLength(2);
  });
});

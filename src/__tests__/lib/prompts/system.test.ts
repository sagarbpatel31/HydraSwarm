import { buildPrompt } from "@/lib/prompts/system";
import { RecallBundle } from "@/lib/hydra";
import { Artifact, AGENT_ORDER, AgentRole } from "@/types/run";

const emptyBundle: RecallBundle = {
  knowledge: [],
  roleMemory: [],
  sharedMemory: [],
};

const sampleBundle: RecallBundle = {
  knowledge: [
    { id: "k1", title: "API Design Guide", content: "REST conventions and error formats for all APIs. " + "x".repeat(300), score: 0.9 },
    { id: "k2", title: "Postmortem Payment Outage", content: "Circuit breaker mandate after P1 incident.", score: 0.8 },
  ],
  roleMemory: [
    { id: "rm1", title: "Scope Management", content: "Always define non-goals explicitly to avoid scope creep.", score: 0.85 },
  ],
  sharedMemory: [
    { id: "sm1", title: "Q2 Priority", content: "Reliability over features. Reduce P1 incidents by 50%.", score: 0.75 },
  ],
};

const sampleArtifact: Artifact = {
  id: "run-001-pm",
  runId: "run-001",
  agentRole: "pm",
  artifactType: "prd",
  title: "PM PRD",
  content: "# Product Requirements\n\n## Goals\n- Implement rate limiting\n- Add audit logging\n" + "x".repeat(700),
  metadata: {},
  createdAt: new Date().toISOString(),
};

describe("buildPrompt", () => {
  test("includes system preamble", () => {
    const prompt = buildPrompt("pm", "Add rate limiting", emptyBundle, []);
    expect(prompt).toContain("HydraSwarm");
    expect(prompt).toContain("specialist");
    expect(prompt).toContain("recalled context");
  });

  test("includes task description", () => {
    const task = "Add rate limiting and audit logs to the billing API";
    const prompt = buildPrompt("pm", task, emptyBundle, []);
    expect(prompt).toContain(task);
  });

  test.each(AGENT_ORDER)("includes role description for '%s'", (role) => {
    const prompt = buildPrompt(role, "Test task", emptyBundle, []);
    expect(prompt).toContain(`Your Role:`);
    // Each role should mention its specific artifact or domain
    expect(prompt.length).toBeGreaterThan(200);
  });

  test("PM prompt mentions spec and acceptance criteria", () => {
    const prompt = buildPrompt("pm", "Test", emptyBundle, []);
    expect(prompt).toContain("Product Manager");
    expect(prompt).toContain("Acceptance Criteria");
  });

  test("CTO prompt mentions approve/reject decision", () => {
    const prompt = buildPrompt("cto", "Test", emptyBundle, []);
    expect(prompt).toContain("CTO");
    expect(prompt).toContain("APPROVE");
  });

  test("empty recall bundle shows no-memory message", () => {
    const prompt = buildPrompt("pm", "Test", emptyBundle, []);
    expect(prompt).toContain("No relevant institutional memory");
  });

  test("formats knowledge recall context", () => {
    const prompt = buildPrompt("pm", "Test", sampleBundle, []);
    expect(prompt).toContain("Recalled Knowledge");
    expect(prompt).toContain("API Design Guide");
    expect(prompt).toContain("Postmortem Payment Outage");
  });

  test("formats role memory recall context", () => {
    const prompt = buildPrompt("pm", "Test", sampleBundle, []);
    expect(prompt).toContain("Your Past Experience");
    expect(prompt).toContain("Scope Management");
  });

  test("formats shared memory recall context", () => {
    const prompt = buildPrompt("pm", "Test", sampleBundle, []);
    expect(prompt).toContain("Organizational Lessons");
    expect(prompt).toContain("Q2 Priority");
  });

  test("truncates knowledge content to 200 chars", () => {
    const prompt = buildPrompt("pm", "Test", sampleBundle, []);
    // The knowledge content is >300 chars but should be sliced
    expect(prompt).toContain("...");
  });

  test("includes previous artifacts", () => {
    const prompt = buildPrompt("architect", "Test", emptyBundle, [sampleArtifact]);
    expect(prompt).toContain("Previous Agent Outputs");
    expect(prompt).toContain("PM");
    expect(prompt).toContain("prd");
  });

  test("truncates long artifact content to 600 chars", () => {
    const prompt = buildPrompt("architect", "Test", emptyBundle, [sampleArtifact]);
    // Artifact content is >700 chars, should be truncated
    expect(prompt).toContain("...");
  });

  test("no previous artifacts section when empty", () => {
    const prompt = buildPrompt("pm", "Test", emptyBundle, []);
    expect(prompt).not.toContain("Previous Agent Outputs");
  });

  test("limits knowledge items to 5", () => {
    const bigBundle: RecallBundle = {
      knowledge: Array.from({ length: 10 }, (_, i) => ({
        id: `k${i}`,
        title: `Doc ${i}`,
        content: `Content ${i}`,
        score: 0.5,
      })),
      roleMemory: [],
      sharedMemory: [],
    };
    const prompt = buildPrompt("pm", "Test", bigBundle, []);
    // Should only include first 5
    expect(prompt).toContain("Doc 0");
    expect(prompt).toContain("Doc 4");
    expect(prompt).not.toContain("Doc 5");
  });

  test("limits role memory items to 3", () => {
    const bigBundle: RecallBundle = {
      knowledge: [],
      roleMemory: Array.from({ length: 6 }, (_, i) => ({
        id: `rm${i}`,
        title: `Memory ${i}`,
        content: `Content ${i}`,
        score: 0.5,
      })),
      sharedMemory: [],
    };
    const prompt = buildPrompt("pm", "Test", bigBundle, []);
    expect(prompt).toContain("Memory 0");
    expect(prompt).toContain("Memory 2");
    expect(prompt).not.toContain("Memory 3");
  });
});

import { TENANT_ID, LLM_MODEL, LLM_MAX_TOKENS, LLM_TEMPERATURE } from "@/lib/config";
import { AGENT_ORDER, ROLE_ARTIFACT_MAP, AgentRole } from "@/types/run";

describe("config", () => {
  test("TENANT_ID is hydraswarm", () => {
    expect(TENANT_ID).toBe("hydraswarm");
  });

  test("LLM_MODEL is gpt-4o-mini", () => {
    expect(LLM_MODEL).toBe("gpt-4o-mini");
  });

  test("LLM_MAX_TOKENS is a positive number", () => {
    expect(LLM_MAX_TOKENS).toBeGreaterThan(0);
  });

  test("LLM_TEMPERATURE is between 0 and 1", () => {
    expect(LLM_TEMPERATURE).toBeGreaterThanOrEqual(0);
    expect(LLM_TEMPERATURE).toBeLessThanOrEqual(1);
  });
});

describe("AGENT_ORDER", () => {
  test("has exactly 7 agents", () => {
    expect(AGENT_ORDER).toHaveLength(7);
  });

  test("starts with pm and ends with cto", () => {
    expect(AGENT_ORDER[0]).toBe("pm");
    expect(AGENT_ORDER[6]).toBe("cto");
  });

  test("has correct sequence", () => {
    expect(AGENT_ORDER).toEqual([
      "pm",
      "architect",
      "developer",
      "reviewer",
      "qa",
      "sre",
      "cto",
    ]);
  });

  test("contains no duplicates", () => {
    const unique = new Set(AGENT_ORDER);
    expect(unique.size).toBe(AGENT_ORDER.length);
  });
});

describe("ROLE_ARTIFACT_MAP", () => {
  test("maps every agent role to an artifact type", () => {
    const roles: AgentRole[] = ["pm", "architect", "developer", "reviewer", "qa", "sre", "cto"];
    for (const role of roles) {
      expect(ROLE_ARTIFACT_MAP[role]).toBeDefined();
      expect(typeof ROLE_ARTIFACT_MAP[role]).toBe("string");
    }
  });

  test("maps pm to prd", () => {
    expect(ROLE_ARTIFACT_MAP.pm).toBe("prd");
  });

  test("maps architect to tech_spec", () => {
    expect(ROLE_ARTIFACT_MAP.architect).toBe("tech_spec");
  });

  test("maps developer to implementation", () => {
    expect(ROLE_ARTIFACT_MAP.developer).toBe("implementation");
  });

  test("maps reviewer to code_review", () => {
    expect(ROLE_ARTIFACT_MAP.reviewer).toBe("code_review");
  });

  test("maps qa to test_plan", () => {
    expect(ROLE_ARTIFACT_MAP.qa).toBe("test_plan");
  });

  test("maps sre to runbook", () => {
    expect(ROLE_ARTIFACT_MAP.sre).toBe("runbook");
  });

  test("maps cto to cto_decision", () => {
    expect(ROLE_ARTIFACT_MAP.cto).toBe("cto_decision");
  });

  test("all artifact types are unique", () => {
    const types = Object.values(ROLE_ARTIFACT_MAP);
    const unique = new Set(types);
    expect(unique.size).toBe(types.length);
  });
});

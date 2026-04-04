import { AGENTS, getAgent } from "@/lib/agents/registry";
import { AGENT_ORDER } from "@/types/run";

describe("AGENTS registry", () => {
  test("has exactly 7 agents", () => {
    expect(AGENTS).toHaveLength(7);
  });

  test("agents are in correct order (0-6)", () => {
    AGENTS.forEach((agent, idx) => {
      expect(agent.order).toBe(idx);
    });
  });

  test("agent roles match AGENT_ORDER", () => {
    const roles = AGENTS.map((a) => a.role);
    expect(roles).toEqual(AGENT_ORDER);
  });

  test("each agent has all required fields", () => {
    for (const agent of AGENTS) {
      expect(agent.role).toBeDefined();
      expect(agent.name).toBeTruthy();
      expect(agent.emoji).toBeTruthy();
      expect(agent.description).toBeTruthy();
      expect(agent.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(typeof agent.order).toBe("number");
    }
  });

  test("all roles are unique", () => {
    const roles = AGENTS.map((a) => a.role);
    expect(new Set(roles).size).toBe(roles.length);
  });

  test("all colors are unique", () => {
    const colors = AGENTS.map((a) => a.color);
    expect(new Set(colors).size).toBe(colors.length);
  });
});

describe("getAgent", () => {
  test.each(AGENT_ORDER)("returns agent for role '%s'", (role) => {
    const agent = getAgent(role);
    expect(agent).toBeDefined();
    expect(agent!.role).toBe(role);
  });

  test("returns undefined for invalid role", () => {
    expect(getAgent("invalid")).toBeUndefined();
    expect(getAgent("")).toBeUndefined();
  });

  test("PM agent has correct name pattern", () => {
    const pm = getAgent("pm");
    expect(pm!.name).toContain("Product Manager");
  });

  test("CTO agent is last in order", () => {
    const cto = getAgent("cto");
    expect(cto!.order).toBe(6);
  });
});

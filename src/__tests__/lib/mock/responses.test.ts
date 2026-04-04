import { getMockResponse } from "@/lib/mock/responses";
import { AGENT_ORDER, AgentRole } from "@/types/run";

describe("getMockResponse", () => {
  const taskDesc = "Add rate limiting to the billing API";

  test.each(AGENT_ORDER)("returns non-empty string for role '%s'", (role) => {
    const response = getMockResponse(role, taskDesc);
    expect(typeof response).toBe("string");
    expect(response.length).toBeGreaterThan(100);
  });

  test("PM response includes required sections", () => {
    const response = getMockResponse("pm", taskDesc);
    expect(response).toContain("Goals");
    expect(response).toContain("Non-Goals");
    expect(response).toContain("Acceptance Criteria");
    expect(response).toContain("User Stories");
    expect(response).toContain("Risk Notes");
  });

  test("PM response includes the task description", () => {
    const response = getMockResponse("pm", taskDesc);
    expect(response).toContain(taskDesc);
  });

  test("Architect response includes design sections", () => {
    const response = getMockResponse("architect", taskDesc);
    expect(response).toContain("Component Design");
    expect(response).toContain("Data Model");
    expect(response).toContain("Risks and Mitigations");
  });

  test("Developer response includes implementation details", () => {
    const response = getMockResponse("developer", taskDesc);
    expect(response).toContain("Files Changed");
    expect(response).toContain("Core Logic");
    expect(response).toContain("Error Handling");
  });

  test("Reviewer response includes review structure", () => {
    const response = getMockResponse("reviewer", taskDesc);
    expect(response).toContain("Issues Found");
    expect(response).toContain("Critical");
    expect(response).toContain("Approval Status");
    expect(response).toContain("Confidence");
  });

  test("QA response includes test categories", () => {
    const response = getMockResponse("qa", taskDesc);
    expect(response).toContain("Unit Tests");
    expect(response).toContain("Integration Tests");
    expect(response).toContain("Edge Cases");
    expect(response).toContain("Performance Tests");
  });

  test("SRE response includes operational sections", () => {
    const response = getMockResponse("sre", taskDesc);
    expect(response).toContain("Pre-Deploy Checklist");
    expect(response).toContain("Rollback Plan");
    expect(response).toContain("Monitoring");
  });

  test("CTO response includes decision structure", () => {
    const response = getMockResponse("cto", taskDesc);
    expect(response).toContain("Decision:");
    expect(response).toContain("Score:");
    expect(response).toContain("Strengths");
    expect(response).toContain("Concerns");
    expect(response).toContain("Lessons for the Organization");
  });

  test("CTO response contains parseable decision and score", () => {
    const response = getMockResponse("cto", taskDesc);
    expect(response).toMatch(/Decision:\s*APPROVED/i);
    expect(response).toMatch(/Score:\s*\d+/i);
  });

  test("Reviewer response references past lessons", () => {
    const response = getMockResponse("reviewer", taskDesc);
    expect(response).toContain("past lesson");
  });

  test("responses reference institutional memory concepts", () => {
    const architectResponse = getMockResponse("architect", taskDesc);
    expect(architectResponse).toContain("postmortem");

    const sreResponse = getMockResponse("sre", taskDesc);
    expect(sreResponse).toContain("circuit breaker");
  });
});

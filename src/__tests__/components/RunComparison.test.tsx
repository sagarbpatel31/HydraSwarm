import { render, screen, fireEvent } from "@testing-library/react";
import { RunComparison } from "@/components/RunComparison";
import type { RunResult } from "@/lib/frontend-types";

function makeRun(overrides: Partial<RunResult> & { taskTitle?: string; score?: number } = {}): RunResult {
  const score = overrides.score ?? 7;
  return {
    task: { taskId: "run-001", title: overrides.taskTitle ?? "Test task", description: "desc", project: "proj", similarityKey: "proj", runNumber: 1 },
    artifacts: [
      { artifactId: "a1", taskId: "run-001", role: "pm", artifactType: "prd", title: "PM PRD", content: "# PRD content", status: "done", metadata: {} },
      { artifactId: "a2", taskId: "run-001", role: "cto", artifactType: "cto_decision", title: "CTO", content: `## Decision: APPROVED\n## Score: ${score}/10`, status: "done", metadata: {} },
    ],
    lessons: [
      { artifactId: "l1", taskId: "run-001", role: "shared", artifactType: "lesson", title: "architecture", content: "Use async processing", status: "", metadata: {} },
    ],
    decision: { artifactId: "a2", taskId: "run-001", role: "cto", artifactType: "cto_decision", title: "CTO", content: `## Decision: APPROVED\n## Score: ${score}/10`, status: "done", metadata: {} },
    graph: { nodes: [], edges: [] },
    replay: [],
    recalledMemory: [],
    ...overrides,
  };
}

describe("RunComparison", () => {
  test("shows message when less than 2 runs", () => {
    render(<RunComparison runs={[makeRun()]} />);
    expect(screen.getByText(/Need at least 2 runs/i)).toBeInTheDocument();
  });

  test("renders comparison with 2 runs", () => {
    const runs = [makeRun({ taskTitle: "Task A" }), makeRun({ taskTitle: "Task B", score: 8 })];
    render(<RunComparison runs={runs} />);
    expect(screen.getByText("Compare Runs")).toBeInTheDocument();
    expect(screen.getAllByText(/Run #1/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Run #2/).length).toBeGreaterThanOrEqual(1);
  });

  test("shows score change delta", () => {
    const runs = [makeRun({ score: 7 }), makeRun({ score: 9 })];
    render(<RunComparison runs={runs} />);
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  test("shows zero delta when scores are equal", () => {
    const runs = [makeRun({ score: 7 }), makeRun({ score: 7 })];
    render(<RunComparison runs={runs} />);
    // Score delta shows 0
    const deltaText = screen.getByText("Score Change").closest("div")?.parentElement;
    expect(deltaText?.textContent).toContain("0");
  });

  test("shows learning proof section", () => {
    const runs = [makeRun(), makeRun()];
    render(<RunComparison runs={runs} />);
    expect(screen.getAllByText(/Why Run #2 is better/).length).toBeGreaterThanOrEqual(1);
  });

  test("shows lessons from left run in proof section", () => {
    const runs = [makeRun(), makeRun()];
    render(<RunComparison runs={runs} />);
    expect(screen.getAllByText(/Use async processing/).length).toBeGreaterThanOrEqual(1);
  });

  test("has run selector dropdowns", () => {
    const runs = [makeRun({ taskTitle: "First" }), makeRun({ taskTitle: "Second" }), makeRun({ taskTitle: "Third" })];
    render(<RunComparison runs={runs} />);
    const selects = screen.getAllByRole("combobox");
    expect(selects).toHaveLength(2);
  });

  test("shows artifact cards for both runs", () => {
    const runs = [makeRun(), makeRun()];
    render(<RunComparison runs={runs} />);
    const pmLabels = screen.getAllByText("PM");
    expect(pmLabels.length).toBeGreaterThanOrEqual(2);
  });
});

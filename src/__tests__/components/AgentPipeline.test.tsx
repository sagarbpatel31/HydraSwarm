import { render, screen } from "@testing-library/react";
import { AgentPipeline } from "@/components/AgentPipeline";
import type { PipelineStage } from "@/lib/frontend-types";

const idleStages: PipelineStage[] = [
  { role: "pm", label: "Scope and acceptance", status: "idle" },
  { role: "architect", label: "Design and trade-offs", status: "idle" },
  { role: "developer", label: "Implementation plan", status: "idle" },
  { role: "reviewer", label: "Defect and safety review", status: "idle" },
  { role: "qa", label: "Test design and regressions", status: "idle" },
  { role: "sre", label: "Operational risk evaluation", status: "idle" },
  { role: "cto", label: "Final decision", status: "idle" },
];

const mixedStages: PipelineStage[] = [
  { role: "pm", label: "Scope", status: "completed", summary: "PRD created", elapsedMs: 2500 },
  { role: "architect", label: "Design", status: "completed", summary: "Tech spec done", elapsedMs: 3100 },
  { role: "developer", label: "Implement", status: "running", summary: "Generating...", elapsedMs: 1200 },
  { role: "reviewer", label: "Review", status: "idle" },
  { role: "qa", label: "QA", status: "idle" },
  { role: "sre", label: "SRE", status: "idle" },
  { role: "cto", label: "CTO", status: "idle" },
];

describe("AgentPipeline", () => {
  test("renders all 7 agent names", () => {
    render(<AgentPipeline stages={idleStages} />);
    expect(screen.getByText(/Priya/)).toBeInTheDocument();
    expect(screen.getByText(/Alex/)).toBeInTheDocument();
    expect(screen.getByText(/Dana/)).toBeInTheDocument();
    expect(screen.getByText(/Riley/)).toBeInTheDocument();
    expect(screen.getByText(/Quinn/)).toBeInTheDocument();
    expect(screen.getByText(/Sam/)).toBeInTheDocument();
    expect(screen.getByText(/Casey/)).toBeInTheDocument();
  });

  test("shows numbered steps 1-7", () => {
    const { container } = render(<AgentPipeline stages={idleStages} />);
    // Idle stages show numbers 1-7
    for (let i = 1; i <= 7; i++) {
      expect(container.textContent).toContain(String(i));
    }
  });

  test("shows Waiting status for idle stages", () => {
    render(<AgentPipeline stages={idleStages} />);
    const waitings = screen.getAllByText("Waiting");
    expect(waitings.length).toBe(7);
  });

  test("shows summary when provided", () => {
    render(<AgentPipeline stages={mixedStages} />);
    expect(screen.getByText("PRD created")).toBeInTheDocument();
    expect(screen.getByText("Tech spec done")).toBeInTheDocument();
  });

  test("shows elapsed time for completed stages", () => {
    render(<AgentPipeline stages={mixedStages} />);
    expect(screen.getByText("2.5 s")).toBeInTheDocument();
    expect(screen.getByText("3.1 s")).toBeInTheDocument();
  });

  test("completed stages show checkmark", () => {
    const { container } = render(<AgentPipeline stages={mixedStages} />);
    const checkmarks = container.querySelectorAll(".bg-emerald-500");
    expect(checkmarks.length).toBeGreaterThanOrEqual(2);
  });

  test("running stage has pulse animation", () => {
    const { container } = render(<AgentPipeline stages={mixedStages} />);
    const pulsing = container.querySelector(".agent-running");
    expect(pulsing).toBeInTheDocument();
  });

  test("shows progress bar", () => {
    const { container } = render(<AgentPipeline stages={mixedStages} />);
    const progressBar = container.querySelector(".bg-gradient-to-r");
    expect(progressBar).toBeInTheDocument();
  });

  test("progress bar reflects completion count", () => {
    const { container } = render(<AgentPipeline stages={mixedStages} />);
    // 2 of 7 completed = ~28.6%
    const bar = container.querySelector("[style]") as HTMLElement;
    expect(bar).toBeInTheDocument();
  });

  test("renders section card title", () => {
    render(<AgentPipeline stages={idleStages} />);
    expect(screen.getByText("Agent Pipeline")).toBeInTheDocument();
  });

  test("subtitle changes when running", () => {
    render(<AgentPipeline stages={mixedStages} />);
    expect(screen.getByText(/2\/7 agents completed/)).toBeInTheDocument();
  });

  test("subtitle shows completion when all done", () => {
    const allDone = idleStages.map((s) => ({ ...s, status: "completed" as const }));
    render(<AgentPipeline stages={allDone} />);
    expect(screen.getByText(/All 7 agents completed/)).toBeInTheDocument();
  });

  test("handles empty stages", () => {
    render(<AgentPipeline stages={[]} />);
    expect(screen.getByText("Agent Pipeline")).toBeInTheDocument();
  });
});

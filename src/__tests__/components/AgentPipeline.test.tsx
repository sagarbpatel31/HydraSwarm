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
  test("renders all 7 agent cards", () => {
    render(<AgentPipeline stages={idleStages} />);
    expect(screen.getByText("PM")).toBeInTheDocument();
    expect(screen.getByText("Architect")).toBeInTheDocument();
    expect(screen.getByText("Developer")).toBeInTheDocument();
    expect(screen.getByText("Reviewer")).toBeInTheDocument();
    expect(screen.getByText("QA")).toBeInTheDocument();
    expect(screen.getByText("SRE")).toBeInTheDocument();
    expect(screen.getByText("CTO")).toBeInTheDocument();
  });

  test("displays labels for each stage", () => {
    render(<AgentPipeline stages={idleStages} />);
    expect(screen.getByText("Scope and acceptance")).toBeInTheDocument();
    expect(screen.getByText("Final decision")).toBeInTheDocument();
  });

  test("shows default message when no summary", () => {
    render(<AgentPipeline stages={idleStages} />);
    const waitingMessages = screen.getAllByText("Waiting for task execution.");
    expect(waitingMessages).toHaveLength(7);
  });

  test("shows summary when provided", () => {
    render(<AgentPipeline stages={mixedStages} />);
    expect(screen.getByText("PRD created")).toBeInTheDocument();
    expect(screen.getByText("Tech spec done")).toBeInTheDocument();
  });

  test("displays formatted elapsed time", () => {
    render(<AgentPipeline stages={mixedStages} />);
    expect(screen.getByText("Elapsed: 2.5 s")).toBeInTheDocument();
    expect(screen.getByText("Elapsed: 3.1 s")).toBeInTheDocument();
    expect(screen.getByText("Elapsed: 1.2 s")).toBeInTheDocument();
  });

  test("shows '--' for elapsed when not set", () => {
    render(<AgentPipeline stages={idleStages} />);
    const dashes = screen.getAllByText("Elapsed: --");
    expect(dashes).toHaveLength(7);
  });

  test("renders correct status for each stage", () => {
    render(<AgentPipeline stages={mixedStages} />);
    const completedBadges = screen.getAllByText("completed");
    expect(completedBadges).toHaveLength(2);
    expect(screen.getByText("running")).toBeInTheDocument();
  });

  test("renders section card wrapper", () => {
    render(<AgentPipeline stages={idleStages} />);
    expect(screen.getByText("Agent pipeline")).toBeInTheDocument();
  });

  test("handles empty stages array", () => {
    render(<AgentPipeline stages={[]} />);
    expect(screen.getByText("Agent pipeline")).toBeInTheDocument();
  });

  test("displays status with mixed states", () => {
    const warningStages: PipelineStage[] = [
      { role: "pm", label: "PM", status: "completed" },
      { role: "architect", label: "Arch", status: "warning" },
      { role: "developer", label: "Dev", status: "failed" },
      { role: "reviewer", label: "Rev", status: "idle" },
      { role: "qa", label: "QA", status: "idle" },
      { role: "sre", label: "SRE", status: "idle" },
      { role: "cto", label: "CTO", status: "idle" },
    ];
    render(<AgentPipeline stages={warningStages} />);
    expect(screen.getByText("warning")).toBeInTheDocument();
    expect(screen.getByText("failed")).toBeInTheDocument();
  });
});

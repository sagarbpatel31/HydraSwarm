import { render, screen, fireEvent } from "@testing-library/react";
import { ArtifactTabs } from "@/components/ArtifactTabs";
import type { AgentArtifact } from "@/lib/frontend-types";

const sampleArtifacts: AgentArtifact[] = [
  {
    artifactId: "a1",
    taskId: "run-001",
    role: "pm",
    artifactType: "prd",
    title: "PM Product Requirements",
    content: "# PRD\n\n## Goals\n- Implement rate limiting\n- Add audit logging",
    status: "done",
    metadata: {},
  },
  {
    artifactId: "a2",
    taskId: "run-001",
    role: "architect",
    artifactType: "tech_spec",
    title: "Architecture Design",
    content: "# Tech Spec\n\n## Component Design\n- Rate limiter middleware",
    status: "done",
    metadata: {},
  },
  {
    artifactId: "a3",
    taskId: "run-001",
    role: "reviewer",
    artifactType: "code_review",
    title: "Code Review Report",
    content: "# Review\n\n## Issues Found\n- Missing error handling",
    status: "done",
    score: 8,
    metadata: {},
  },
  {
    artifactId: "a4",
    taskId: "run-001",
    role: "shared",
    artifactType: "lesson",
    title: "Extracted Lesson",
    content: "Use circuit breakers on all external deps",
    status: "",
    metadata: {},
  },
];

describe("ArtifactTabs", () => {
  test("shows placeholder when no artifacts", () => {
    render(<ArtifactTabs artifacts={[]} />);
    expect(screen.getByText(/Run a task to populate/i)).toBeInTheDocument();
  });

  test("renders all artifact tabs", () => {
    render(<ArtifactTabs artifacts={sampleArtifacts} />);
    // First artifact title appears in both tab and detail, others only in tab
    expect(screen.getAllByText("PM Product Requirements").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Architecture Design")).toBeInTheDocument();
    expect(screen.getByText("Code Review Report")).toBeInTheDocument();
  });

  test("first artifact is selected by default", () => {
    render(<ArtifactTabs artifacts={sampleArtifacts} />);
    // First artifact's content should be visible
    expect(screen.getByText(/PRD/)).toBeInTheDocument();
    expect(screen.getByText(/Implement rate limiting/)).toBeInTheDocument();
  });

  test("clicking a tab selects it and shows its content", () => {
    render(<ArtifactTabs artifacts={sampleArtifacts} />);
    fireEvent.click(screen.getByText("Architecture Design"));
    expect(screen.getByText(/Component Design/)).toBeInTheDocument();
    expect(screen.getByText(/Rate limiter middleware/)).toBeInTheDocument();
  });

  test("shows score badge when score is defined", () => {
    render(<ArtifactTabs artifacts={sampleArtifacts} />);
    fireEvent.click(screen.getByText("Code Review Report"));
    expect(screen.getByText("Score 8")).toBeInTheDocument();
  });

  test("does not show score badge when score is undefined", () => {
    render(<ArtifactTabs artifacts={sampleArtifacts} />);
    // PM artifact is selected by default, no score
    expect(screen.queryByText(/Score \d/)).not.toBeInTheDocument();
  });

  test("shows artifact type badge", () => {
    render(<ArtifactTabs artifacts={sampleArtifacts} />);
    expect(screen.getAllByText("prd").length).toBeGreaterThan(0);
  });

  test("shows status badges", () => {
    render(<ArtifactTabs artifacts={sampleArtifacts} />);
    const doneBadges = screen.getAllByText("done");
    expect(doneBadges.length).toBeGreaterThan(0);
  });

  test("handles shared role artifact", () => {
    render(<ArtifactTabs artifacts={sampleArtifacts} />);
    expect(screen.getByText("Shared")).toBeInTheDocument();
  });

  test("renders role labels for each artifact", () => {
    render(<ArtifactTabs artifacts={sampleArtifacts} />);
    expect(screen.getByText("PM")).toBeInTheDocument();
    expect(screen.getByText("Architect")).toBeInTheDocument();
    expect(screen.getByText("Reviewer")).toBeInTheDocument();
  });

  test("selected artifact has different styling", () => {
    const { container } = render(<ArtifactTabs artifacts={sampleArtifacts} />);
    const buttons = container.querySelectorAll("button");
    // First button should have accent styling
    expect(buttons[0].className).toContain("border-accent-300");
  });

  test("content renders in pre tag with whitespace-pre-wrap", () => {
    const { container } = render(<ArtifactTabs artifacts={sampleArtifacts} />);
    const pre = container.querySelector("pre");
    expect(pre).toBeInTheDocument();
    expect(pre?.className).toContain("whitespace-pre-wrap");
  });
});

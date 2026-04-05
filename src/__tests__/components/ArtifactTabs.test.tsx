// Mock react-markdown (ESM-only module)
jest.mock("react-markdown", () => {
  return ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>;
});

import { render, screen, fireEvent } from "@testing-library/react";
import { ArtifactTabs } from "@/components/ArtifactTabs";
import type { AgentArtifact } from "@/lib/frontend-types";

const sampleArtifacts: AgentArtifact[] = [
  {
    artifactId: "a1", taskId: "run-001", role: "pm", artifactType: "prd",
    title: "PM Product Requirements", content: "# PRD\n\n## Goals\n- Implement rate limiting",
    status: "done", metadata: {},
  },
  {
    artifactId: "a2", taskId: "run-001", role: "architect", artifactType: "tech_spec",
    title: "Architecture Design", content: "# Tech Spec\n\n## Component Design",
    status: "done", metadata: {},
  },
  {
    artifactId: "a3", taskId: "run-001", role: "reviewer", artifactType: "code_review",
    title: "Code Review Report", content: "# Review\n\n## Issues Found",
    status: "done", score: 8, metadata: {},
  },
  {
    artifactId: "a4", taskId: "run-001", role: "shared", artifactType: "lesson",
    title: "Extracted Lesson", content: "Use circuit breakers",
    status: "", metadata: {},
  },
];

describe("ArtifactTabs", () => {
  test("shows placeholder when no artifacts", () => {
    render(<ArtifactTabs artifacts={[]} />);
    expect(screen.getByText(/Run a task to see agent outputs/i)).toBeInTheDocument();
  });

  test("renders horizontal tab pills for all roles", () => {
    render(<ArtifactTabs artifacts={sampleArtifacts} />);
    expect(screen.getByText("PM")).toBeInTheDocument();
    expect(screen.getByText("Architect")).toBeInTheDocument();
    expect(screen.getByText("Reviewer")).toBeInTheDocument();
    expect(screen.getByText("Lessons")).toBeInTheDocument();
  });

  test("PM is selected by default and shows content below", () => {
    render(<ArtifactTabs artifacts={sampleArtifacts} />);
    expect(screen.getByText("PM Product Requirements")).toBeInTheDocument();
    expect(screen.getByText(/Implement rate limiting/)).toBeInTheDocument();
  });

  test("clicking Architect tab shows architect content below", () => {
    render(<ArtifactTabs artifacts={sampleArtifacts} />);
    fireEvent.click(screen.getByText("Architect"));
    expect(screen.getByText("Architecture Design")).toBeInTheDocument();
    expect(screen.getByText(/Component Design/)).toBeInTheDocument();
  });

  test("clicking Reviewer tab shows score badge", () => {
    render(<ArtifactTabs artifacts={sampleArtifacts} />);
    fireEvent.click(screen.getByText("Reviewer"));
    expect(screen.getByText("Score 8")).toBeInTheDocument();
  });

  test("tabs without artifacts are disabled", () => {
    render(<ArtifactTabs artifacts={sampleArtifacts} />);
    // Developer has no artifact, should be disabled
    const devButton = screen.getByText("Developer").closest("button");
    expect(devButton).toBeDisabled();
  });

  test("tabs with artifacts are enabled", () => {
    render(<ArtifactTabs artifacts={sampleArtifacts} />);
    const pmButton = screen.getByText("PM").closest("button");
    expect(pmButton).not.toBeDisabled();
  });

  test("selected tab has role-specific color", () => {
    render(<ArtifactTabs artifacts={sampleArtifacts} />);
    const pmButton = screen.getByText("PM").closest("button");
    // PM tab uses sky-600 color when selected
    expect(pmButton?.className).toContain("text-white");
    expect(pmButton?.className).toContain("shadow-sm");
  });

  test("renders status badge in content panel", () => {
    render(<ArtifactTabs artifacts={sampleArtifacts} />);
    expect(screen.getByText("done")).toBeInTheDocument();
  });

  test("shows section card title", () => {
    render(<ArtifactTabs artifacts={sampleArtifacts} />);
    expect(screen.getByText("Artifacts")).toBeInTheDocument();
  });

  test("Lessons tab works for shared role", () => {
    render(<ArtifactTabs artifacts={sampleArtifacts} />);
    fireEvent.click(screen.getByText("Lessons"));
    expect(screen.getByText("Extracted Lesson")).toBeInTheDocument();
    expect(screen.getByText(/circuit breakers/)).toBeInTheDocument();
  });
});

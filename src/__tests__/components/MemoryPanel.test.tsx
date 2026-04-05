import { render, screen } from "@testing-library/react";
import { MemoryPanel } from "@/components/MemoryPanel";
import type { MemorySnippet } from "@/lib/frontend-types";

const sampleItems: MemorySnippet[] = [
  {
    id: "m1",
    title: "API Design Guide",
    content: "REST conventions and error formats for all APIs.",
    bucket: "knowledge",
    score: 0.92,
    role: "pm",
  },
  {
    id: "m2",
    title: "Circuit Breaker Mandate",
    content: "All services handling financial data MUST have circuit breakers.",
    bucket: "roleMemory",
    role: "architect",
  },
  {
    id: "m3",
    title: "Q2 Priority",
    content: "Reliability over features. Reduce P1 incidents by 50%.",
    bucket: "sharedMemory",
    score: 0.75,
  },
];

describe("MemoryPanel", () => {
  test("shows placeholder when no items", () => {
    render(<MemoryPanel items={[]} />);
    expect(screen.getByText(/No recall bundle yet/i)).toBeInTheDocument();
  });

  test("renders all memory items", () => {
    render(<MemoryPanel items={sampleItems} />);
    expect(screen.getByText("API Design Guide")).toBeInTheDocument();
    expect(screen.getByText("Circuit Breaker Mandate")).toBeInTheDocument();
    expect(screen.getByText("Q2 Priority")).toBeInTheDocument();
  });

  test("shows correct bucket labels", () => {
    render(<MemoryPanel items={sampleItems} />);
    expect(screen.getByText("Knowledge")).toBeInTheDocument();
    expect(screen.getByText("Role memory")).toBeInTheDocument();
    expect(screen.getByText("Shared lesson")).toBeInTheDocument();
  });

  test("shows content for each item", () => {
    render(<MemoryPanel items={sampleItems} />);
    expect(screen.getByText(/REST conventions/)).toBeInTheDocument();
    expect(screen.getByText(/circuit breakers/)).toBeInTheDocument();
    expect(screen.getByText(/Reduce P1 incidents/)).toBeInTheDocument();
  });

  test("shows score badge when score is defined", () => {
    render(<MemoryPanel items={sampleItems} />);
    expect(screen.getByText("score 0.92")).toBeInTheDocument();
    expect(screen.getByText("score 0.75")).toBeInTheDocument();
  });

  test("does not show score badge when score is undefined", () => {
    const itemsWithoutScore: MemorySnippet[] = [
      { id: "m1", title: "Test", content: "Content", bucket: "knowledge" },
    ];
    render(<MemoryPanel items={itemsWithoutScore} />);
    expect(screen.queryByText(/score/)).not.toBeInTheDocument();
  });

  test("shows role badge when role is defined", () => {
    render(<MemoryPanel items={sampleItems} />);
    expect(screen.getByText("pm")).toBeInTheDocument();
    expect(screen.getByText("architect")).toBeInTheDocument();
  });

  test("does not show role badge when role is undefined", () => {
    const noRoleItems: MemorySnippet[] = [
      { id: "m1", title: "Shared", content: "Content", bucket: "sharedMemory" },
    ];
    render(<MemoryPanel items={noRoleItems} />);
    // Should not have any role badge (only bucket label)
    expect(screen.queryByText("pm")).not.toBeInTheDocument();
  });

  test("score 0 is displayed (not hidden)", () => {
    const zeroScoreItems: MemorySnippet[] = [
      { id: "m1", title: "Test", content: "Content", bucket: "knowledge", score: 0 },
    ];
    render(<MemoryPanel items={zeroScoreItems} />);
    expect(screen.getByText("score 0.00")).toBeInTheDocument();
  });

  test("renders section card with correct title", () => {
    render(<MemoryPanel items={[]} />);
    expect(screen.getByText("Lessons and recalled context")).toBeInTheDocument();
  });
});

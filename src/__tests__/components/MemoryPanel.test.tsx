import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryPanel } from "@/components/MemoryPanel";
import type { MemorySnippet } from "@/lib/frontend-types";

const sampleItems: MemorySnippet[] = [
  { id: "m1", title: "API Design Guide", content: "REST conventions for APIs.", bucket: "knowledge", score: 0.92, role: "pm" },
  { id: "m2", title: "Circuit Breaker Mandate", content: "All services MUST have circuit breakers.", bucket: "roleMemory", role: "architect" },
  { id: "m3", title: "Q2 Priority", content: "Reliability over features.", bucket: "sharedMemory", score: 0.75 },
];

describe("MemoryPanel", () => {
  test("shows placeholder when no items", () => {
    render(<MemoryPanel items={[]} />);
    expect(screen.getByText(/No context recalled yet/i)).toBeInTheDocument();
  });

  test("renders section title", () => {
    render(<MemoryPanel items={[]} />);
    expect(screen.getByText("Recalled Context")).toBeInTheDocument();
  });

  test("groups items by bucket with headers", () => {
    render(<MemoryPanel items={sampleItems} />);
    expect(screen.getByText(/Knowledge Base/)).toBeInTheDocument();
    expect(screen.getByText(/Agent Memory/)).toBeInTheDocument();
    expect(screen.getByText(/Shared Lessons/)).toBeInTheDocument();
  });

  test("shows item titles in collapsed state", () => {
    render(<MemoryPanel items={sampleItems} />);
    expect(screen.getByText("API Design Guide")).toBeInTheDocument();
    expect(screen.getByText("Circuit Breaker Mandate")).toBeInTheDocument();
    expect(screen.getByText("Q2 Priority")).toBeInTheDocument();
  });

  test("content is hidden in collapsed state", () => {
    render(<MemoryPanel items={sampleItems} />);
    expect(screen.queryByText("REST conventions for APIs.")).not.toBeInTheDocument();
  });

  test("clicking item expands to show content", () => {
    render(<MemoryPanel items={sampleItems} />);
    fireEvent.click(screen.getByText("API Design Guide"));
    expect(screen.getByText("REST conventions for APIs.")).toBeInTheDocument();
  });

  test("clicking expanded item collapses it", () => {
    render(<MemoryPanel items={sampleItems} />);
    fireEvent.click(screen.getByText("API Design Guide"));
    expect(screen.getByText("REST conventions for APIs.")).toBeInTheDocument();
    fireEvent.click(screen.getByText("API Design Guide"));
    expect(screen.queryByText("REST conventions for APIs.")).not.toBeInTheDocument();
  });

  test("shows score as percentage when defined", () => {
    render(<MemoryPanel items={sampleItems} />);
    // Score 0.92 displays as "92%"
    expect(screen.getByText("92%")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  test("shows role badge for items with role", () => {
    render(<MemoryPanel items={sampleItems} />);
    expect(screen.getByText("PM")).toBeInTheDocument();
    expect(screen.getByText("Architect")).toBeInTheDocument();
  });

  test("shows bucket count badge", () => {
    render(<MemoryPanel items={sampleItems} />);
    // Count badges show as separate elements
    const badges = screen.getAllByText("1");
    expect(badges.length).toBeGreaterThanOrEqual(3);
  });
});

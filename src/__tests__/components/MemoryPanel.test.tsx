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
    expect(screen.getByText(/Run a task to see what agents recall/i)).toBeInTheDocument();
  });

  test("renders section title", () => {
    render(<MemoryPanel items={[]} />);
    expect(screen.getByText("Recalled context")).toBeInTheDocument();
  });

  test("groups items by bucket with headers", () => {
    render(<MemoryPanel items={sampleItems} />);
    expect(screen.getByText(/Knowledge/)).toBeInTheDocument();
    expect(screen.getByText(/Role memory/)).toBeInTheDocument();
    expect(screen.getByText(/Shared lesson/)).toBeInTheDocument();
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

  test("shows score when defined", () => {
    render(<MemoryPanel items={sampleItems} />);
    expect(screen.getByText("0.92")).toBeInTheDocument();
    expect(screen.getByText("0.75")).toBeInTheDocument();
  });

  test("shows role badge for items with role", () => {
    render(<MemoryPanel items={sampleItems} />);
    expect(screen.getByText("pm")).toBeInTheDocument();
    expect(screen.getByText("architect")).toBeInTheDocument();
  });

  test("shows bucket count in header", () => {
    render(<MemoryPanel items={sampleItems} />);
    expect(screen.getByText(/Knowledge \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Role memory \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Shared lesson \(1\)/)).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { ReplayTimeline } from "@/components/ReplayTimeline";
import type { ReplayEvent } from "@/lib/frontend-types";

const sampleEvents: ReplayEvent[] = [
  {
    id: "e1",
    role: "pm",
    startedAt: "2026-04-04T10:00:00Z",
    finishedAt: "2026-04-04T10:00:03Z",
    summary: "Created product requirements with acceptance criteria.",
    recalledLessonIds: ["lesson-001", "lesson-002"],
    status: "completed",
  },
  {
    id: "e2",
    role: "architect",
    startedAt: "2026-04-04T10:00:03Z",
    finishedAt: "2026-04-04T10:00:06Z",
    summary: "Designed system architecture with circuit breakers.",
    recalledLessonIds: [],
    status: "completed",
  },
  {
    id: "e3",
    role: "developer",
    startedAt: "2026-04-04T10:00:06Z",
    finishedAt: "2026-04-04T10:00:10Z",
    summary: "Implementation plan with pseudocode.",
    status: "completed",
  },
];

describe("ReplayTimeline", () => {
  test("shows placeholder when no events", () => {
    render(<ReplayTimeline events={[]} />);
    expect(screen.getByText(/Timeline events will appear/i)).toBeInTheDocument();
  });

  test("renders all events", () => {
    render(<ReplayTimeline events={sampleEvents} />);
    expect(screen.getByText(/product requirements/)).toBeInTheDocument();
    expect(screen.getByText(/system architecture/)).toBeInTheDocument();
    expect(screen.getByText(/Implementation plan/)).toBeInTheDocument();
  });

  test("shows role badges for each event", () => {
    render(<ReplayTimeline events={sampleEvents} />);
    expect(screen.getByText("PM")).toBeInTheDocument();
    expect(screen.getByText("Architect")).toBeInTheDocument();
    expect(screen.getByText("Developer")).toBeInTheDocument();
  });

  test("shows status badges for each event", () => {
    render(<ReplayTimeline events={sampleEvents} />);
    const completedBadges = screen.getAllByText("completed");
    expect(completedBadges).toHaveLength(3);
  });

  test("shows recalled lesson IDs when present", () => {
    render(<ReplayTimeline events={sampleEvents} />);
    expect(screen.getByText(/lesson-001, lesson-002/)).toBeInTheDocument();
  });

  test("does not show recalled section when no lessons", () => {
    render(<ReplayTimeline events={[sampleEvents[1]]} />);
    expect(screen.queryByText(/Recalled:/)).not.toBeInTheDocument();
  });

  test("does not show recalled section when recalledLessonIds is undefined", () => {
    render(<ReplayTimeline events={[sampleEvents[2]]} />);
    expect(screen.queryByText(/Recalled:/)).not.toBeInTheDocument();
  });

  test("renders timestamps", () => {
    render(<ReplayTimeline events={sampleEvents} />);
    const startedLabels = screen.getAllByText(/Started:/);
    const finishedLabels = screen.getAllByText(/Finished:/);
    expect(startedLabels).toHaveLength(3);
    expect(finishedLabels).toHaveLength(3);
  });

  test("has connector line between events but not after last", () => {
    const { container } = render(<ReplayTimeline events={sampleEvents} />);
    // Connector lines (absolute positioned divs with w-px)
    const connectors = container.querySelectorAll(".w-px");
    // First two events have connectors, last one doesn't
    expect(connectors).toHaveLength(2);
  });

  test("single event has no connector line", () => {
    const { container } = render(<ReplayTimeline events={[sampleEvents[0]]} />);
    const connectors = container.querySelectorAll(".w-px");
    expect(connectors).toHaveLength(0);
  });

  test("renders section card with correct title", () => {
    render(<ReplayTimeline events={[]} />);
    expect(screen.getByText("Replay timeline")).toBeInTheDocument();
  });

  test("mixed statuses render correctly", () => {
    const mixedEvents: ReplayEvent[] = [
      { id: "e1", role: "pm", startedAt: "", finishedAt: "", summary: "Done", status: "completed" },
      { id: "e2", role: "architect", startedAt: "", finishedAt: "", summary: "Working", status: "running" },
      { id: "e3", role: "developer", startedAt: "", finishedAt: "", summary: "Failed", status: "failed" },
    ];
    render(<ReplayTimeline events={mixedEvents} />);
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("running")).toBeInTheDocument();
    expect(screen.getByText("failed")).toBeInTheDocument();
  });
});

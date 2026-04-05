import { render, screen } from "@testing-library/react";
import { ReplayTimeline } from "@/components/ReplayTimeline";
import type { ReplayEvent } from "@/lib/frontend-types";

const sampleEvents: ReplayEvent[] = [
  {
    id: "e1", role: "pm",
    startedAt: "2026-04-04T10:00:00Z", finishedAt: "2026-04-04T10:00:03Z",
    summary: "Created product requirements with acceptance criteria.",
    recalledLessonIds: ["lesson-001", "lesson-002", "lesson-003"],
    status: "completed",
  },
  {
    id: "e2", role: "architect",
    startedAt: "2026-04-04T10:00:03Z", finishedAt: "2026-04-04T10:00:06Z",
    summary: "Designed system architecture with circuit breakers.",
    recalledLessonIds: [],
    status: "completed",
  },
  {
    id: "e3", role: "developer",
    startedAt: "2026-04-04T10:00:06Z", finishedAt: "2026-04-04T10:00:10Z",
    summary: "Implementation plan with pseudocode.",
    status: "failed",
  },
];

describe("ReplayTimeline", () => {
  test("shows placeholder when no events", () => {
    render(<ReplayTimeline events={[]} />);
    expect(screen.getByText(/Timeline appears after a run/i)).toBeInTheDocument();
  });

  test("renders all events", () => {
    render(<ReplayTimeline events={sampleEvents} />);
    expect(screen.getByText(/product requirements/)).toBeInTheDocument();
    expect(screen.getByText(/system architecture/)).toBeInTheDocument();
    expect(screen.getByText(/Implementation plan/)).toBeInTheDocument();
  });

  test("shows role badges", () => {
    render(<ReplayTimeline events={sampleEvents} />);
    expect(screen.getByText("PM")).toBeInTheDocument();
    expect(screen.getByText("Architect")).toBeInTheDocument();
    expect(screen.getByText("Developer")).toBeInTheDocument();
  });

  test("shows status badges", () => {
    render(<ReplayTimeline events={sampleEvents} />);
    const completedBadges = screen.getAllByText("completed");
    expect(completedBadges).toHaveLength(2);
    expect(screen.getByText("failed")).toBeInTheDocument();
  });

  test("shows recalled count badge instead of raw UUIDs", () => {
    render(<ReplayTimeline events={sampleEvents} />);
    // Should show count badge, NOT raw UUIDs
    expect(screen.getByText(/3 recalled/)).toBeInTheDocument();
    expect(screen.queryByText("lesson-001")).not.toBeInTheDocument();
  });

  test("does not show recalled badge when count is 0", () => {
    render(<ReplayTimeline events={[sampleEvents[1]]} />);
    expect(screen.queryByText(/recalled/)).not.toBeInTheDocument();
  });

  test("does not show recalled badge when undefined", () => {
    render(<ReplayTimeline events={[sampleEvents[2]]} />);
    expect(screen.queryByText(/recalled/)).not.toBeInTheDocument();
  });

  test("shows elapsed time in seconds", () => {
    render(<ReplayTimeline events={sampleEvents} />);
    const elapsed = screen.getAllByText("3s");
    expect(elapsed.length).toBeGreaterThanOrEqual(1);
  });

  test("renders section card title", () => {
    render(<ReplayTimeline events={[]} />);
    expect(screen.getByText("Replay timeline")).toBeInTheDocument();
  });

  test("truncates long summaries", () => {
    const longEvent: ReplayEvent = {
      id: "long", role: "pm",
      startedAt: "2026-04-04T10:00:00Z", finishedAt: "2026-04-04T10:00:03Z",
      summary: "A".repeat(200),
      status: "completed",
    };
    render(<ReplayTimeline events={[longEvent]} />);
    // Summary should be truncated via line-clamp-2 CSS class
    const summary = screen.getByText(/^A+/);
    expect(summary.className).toContain("line-clamp-2");
  });
});

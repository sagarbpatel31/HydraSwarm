/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock("reactflow", () => {
  const MockReactFlow = ({ children, nodes, edges }: any) => (
    <div data-testid="reactflow" data-nodes={JSON.stringify(nodes)} data-edges={JSON.stringify(edges)}>
      {children}
    </div>
  );
  const Background = () => <div data-testid="rf-background" />;
  const Controls = () => <div data-testid="rf-controls" />;
  return {
    __esModule: true,
    default: MockReactFlow,
    Background,
    Controls,
    MarkerType: { ArrowClosed: "arrowclosed" },
  };
});
jest.mock("reactflow/dist/style.css", () => ({}));

import { render, screen } from "@testing-library/react";
import { GraphPanel } from "@/components/GraphPanel";
import type { FlowNode, FlowEdge } from "@/lib/frontend-types";

const emptyGraph = { nodes: [] as FlowNode[], edges: [] as FlowEdge[] };

const sampleGraph = {
  nodes: [
    { id: "n1", position: { x: 0, y: 40 }, data: { label: "Task", nodeType: "task" } },
    { id: "n2", position: { x: 160, y: 40 }, data: { label: "PM: prd", nodeType: "pm" } },
    { id: "n3", position: { x: 100, y: 180 }, data: { label: "Lesson", nodeType: "lesson" } },
  ] as FlowNode[],
  edges: [
    { id: "e1", source: "n1", target: "n2", label: "produces" },
    { id: "e2", source: "n2", target: "n3", label: "extracted_lesson", animated: true },
  ] as FlowEdge[],
};

describe("GraphPanel", () => {
  test("shows placeholder when no nodes", () => {
    render(<GraphPanel graph={emptyGraph} />);
    expect(screen.getByText(/Graph appears after a run/i)).toBeInTheDocument();
  });

  test("renders ReactFlow when nodes exist", () => {
    render(<GraphPanel graph={sampleGraph} />);
    expect(screen.getByTestId("reactflow")).toBeInTheDocument();
  });

  test("renders Background and Controls", () => {
    render(<GraphPanel graph={sampleGraph} />);
    expect(screen.getByTestId("rf-background")).toBeInTheDocument();
    expect(screen.getByTestId("rf-controls")).toBeInTheDocument();
  });

  test("passes nodes to ReactFlow with custom styles", () => {
    render(<GraphPanel graph={sampleGraph} />);
    const rf = screen.getByTestId("reactflow");
    const nodes = JSON.parse(rf.getAttribute("data-nodes") || "[]");
    expect(nodes).toHaveLength(3);
    // Nodes should have style objects
    expect(nodes[0].style).toBeDefined();
    expect(nodes[0].style.borderRadius).toBe(12);
  });

  test("passes edges with markers to ReactFlow", () => {
    render(<GraphPanel graph={sampleGraph} />);
    const rf = screen.getByTestId("reactflow");
    const edges = JSON.parse(rf.getAttribute("data-edges") || "[]");
    expect(edges).toHaveLength(2);
    expect(edges[0].markerEnd).toBeDefined();
  });

  test("renders section card title", () => {
    render(<GraphPanel graph={emptyGraph} />);
    expect(screen.getByText("Task Lineage Graph")).toBeInTheDocument();
  });

  test("graph container has 500px height", () => {
    const { container } = render(<GraphPanel graph={sampleGraph} />);
    const graphDiv = container.querySelector(".h-\\[500px\\]");
    expect(graphDiv).toBeInTheDocument();
  });
});

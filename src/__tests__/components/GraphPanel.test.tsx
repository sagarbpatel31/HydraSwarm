/* eslint-disable @typescript-eslint/no-explicit-any */
// Mock ReactFlow since it requires browser APIs
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
    { id: "n1", position: { x: 50, y: 0 }, data: { label: "Task" } },
    { id: "n2", position: { x: 50, y: 100 }, data: { label: "PM: prd" } },
    { id: "n3", position: { x: 50, y: 200 }, data: { label: "Lesson" } },
  ] as FlowNode[],
  edges: [
    { id: "e1", source: "n1", target: "n2", label: "produces" },
    { id: "e2", source: "n2", target: "n3", label: "extracted_lesson", animated: true },
  ] as FlowEdge[],
};

describe("GraphPanel", () => {
  test("shows placeholder when no nodes", () => {
    render(<GraphPanel graph={emptyGraph} />);
    expect(screen.getByText(/Graph data will appear/i)).toBeInTheDocument();
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

  test("passes nodes to ReactFlow", () => {
    render(<GraphPanel graph={sampleGraph} />);
    const rf = screen.getByTestId("reactflow");
    const nodes = JSON.parse(rf.getAttribute("data-nodes") || "[]");
    expect(nodes).toHaveLength(3);
    expect(nodes[0].id).toBe("n1");
  });

  test("passes edges with markerEnd to ReactFlow", () => {
    render(<GraphPanel graph={sampleGraph} />);
    const rf = screen.getByTestId("reactflow");
    const edges = JSON.parse(rf.getAttribute("data-edges") || "[]");
    expect(edges).toHaveLength(2);
    expect(edges[0].markerEnd).toBeDefined();
    expect(edges[0].markerEnd.type).toBe("arrowclosed");
  });

  test("renders section card with title", () => {
    render(<GraphPanel graph={emptyGraph} />);
    expect(screen.getByText("Task lineage graph")).toBeInTheDocument();
  });

  test("container has correct height for graph", () => {
    const { container } = render(<GraphPanel graph={sampleGraph} />);
    const graphContainer = container.querySelector(".h-\\[420px\\]");
    expect(graphContainer).toBeInTheDocument();
  });
});

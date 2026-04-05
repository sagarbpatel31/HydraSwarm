export type AgentRole =
  | "pm"
  | "architect"
  | "developer"
  | "reviewer"
  | "qa"
  | "sre"
  | "cto";

export interface TaskInput {
  taskId: string;
  title: string;
  description: string;
  project: string;
  similarityKey: string;
  runNumber: number;
}

export interface AgentArtifact {
  artifactId: string;
  taskId: string;
  role: AgentRole | "shared";
  artifactType: string;
  title: string;
  content: string;
  status: string;
  score?: number;
  metadata: Record<string, string | number | boolean>;
}

export interface MemorySnippet {
  id: string;
  title: string;
  content: string;
  bucket: "knowledge" | "roleMemory" | "sharedMemory";
  score?: number;
  role?: AgentRole | "shared";
}

export interface ReplayEvent {
  id: string;
  role: AgentRole;
  startedAt: string;
  finishedAt: string;
  summary: string;
  recalledLessonIds?: string[];
  status: "idle" | "running" | "completed" | "warning" | "failed";
}

export interface FlowNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface RunResult {
  task: TaskInput;
  artifacts: AgentArtifact[];
  lessons: AgentArtifact[];
  decision: AgentArtifact | null;
  graph: { nodes: FlowNode[]; edges: FlowEdge[] };
  replay?: ReplayEvent[];
  recalledMemory?: MemorySnippet[];
}

export interface PipelineStage {
  role: AgentRole;
  label: string;
  status: "idle" | "running" | "completed" | "warning" | "failed";
  summary?: string;
  elapsedMs?: number;
}

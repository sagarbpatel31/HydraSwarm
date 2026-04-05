export type AgentRole =
  | "pm"
  | "architect"
  | "developer"
  | "reviewer"
  | "qa"
  | "sre"
  | "cto";

export const AGENT_ORDER: AgentRole[] = [
  "pm",
  "architect",
  "developer",
  "reviewer",
  "qa",
  "sre",
  "cto",
];

export type ArtifactType =
  | "prd"
  | "tech_spec"
  | "implementation"
  | "code_review"
  | "test_plan"
  | "runbook"
  | "cto_decision";

export const ROLE_ARTIFACT_MAP: Record<AgentRole, ArtifactType> = {
  pm: "prd",
  architect: "tech_spec",
  developer: "implementation",
  reviewer: "code_review",
  qa: "test_plan",
  sre: "runbook",
  cto: "cto_decision",
};

export interface AgentDefinition {
  role: AgentRole;
  name: string;
  emoji: string;
  description: string;
  color: string;
  order: number;
}

export interface Artifact {
  id: string;
  runId: string;
  agentRole: AgentRole;
  artifactType: ArtifactType;
  title: string;
  content: string;
  metadata: Record<string, string | number | boolean>;
  createdAt: string;
}

export type RunStatus = "queued" | "running" | "completed" | "failed";
export type StepStatus =
  | "pending"
  | "recalling"
  | "generating"
  | "storing"
  | "done"
  | "error";

export interface RecallDetail {
  id: string;
  title: string;
  content: string;
  score: number;
  bucket: "knowledge" | "roleMemory" | "sharedMemory";
}

export interface AgentStep {
  agentRole: AgentRole;
  status: StepStatus;
  recallContext?: string[];
  recallDetails?: RecallDetail[];
  artifact?: Artifact;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
}

export interface Lesson {
  id: string;
  category: string;
  insight: string;
  source: string;
  createdAt: string;
}

export interface Evaluation {
  approved: boolean;
  score: number;
  reasoning: string;
  lessonsExtracted: Lesson[];
}

export interface Run {
  id: string;
  taskDescription: string;
  similarityKey: string;
  status: RunStatus;
  runNumber: number;
  steps: AgentStep[];
  evaluation?: Evaluation;
  createdAt: string;
  completedAt?: string;
}

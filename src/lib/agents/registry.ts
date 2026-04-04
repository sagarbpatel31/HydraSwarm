import { AgentDefinition } from "@/types/run";

export const AGENTS: AgentDefinition[] = [
  {
    role: "pm",
    name: "Priya — Product Manager",
    emoji: "📋",
    description:
      "Turns raw feature requests into scoped specs with acceptance criteria",
    color: "#3B82F6",
    order: 0,
  },
  {
    role: "architect",
    name: "Alex — Architect",
    emoji: "🏗️",
    description:
      "Designs system architecture, proposes tradeoffs and dependency maps",
    color: "#8B5CF6",
    order: 1,
  },
  {
    role: "developer",
    name: "Dana — Developer",
    emoji: "💻",
    description:
      "Writes implementation plans with pseudocode and file-level changes",
    color: "#10B981",
    order: 2,
  },
  {
    role: "reviewer",
    name: "Riley — Reviewer",
    emoji: "🔍",
    description: "Critiques implementation, flags defects and risks",
    color: "#F59E0B",
    order: 3,
  },
  {
    role: "qa",
    name: "Quinn — QA Engineer",
    emoji: "🧪",
    description: "Generates test plans, edge cases, and simulated test results",
    color: "#EF4444",
    order: 4,
  },
  {
    role: "sre",
    name: "Sam — SRE",
    emoji: "🛡️",
    description:
      "Evaluates deployment risk, operational readiness, and rollback plans",
    color: "#06B6D4",
    order: 5,
  },
  {
    role: "cto",
    name: "Casey — CTO",
    emoji: "👔",
    description:
      "Makes final approve/revise/reject decision with organizational rationale",
    color: "#6366F1",
    order: 6,
  },
];

export function getAgent(role: string): AgentDefinition | undefined {
  return AGENTS.find((a) => a.role === role);
}

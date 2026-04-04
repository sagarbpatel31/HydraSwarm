import { AgentRole, Artifact } from "@/types/run";
import { RecallBundle } from "@/lib/hydra";
import { getAgent } from "@/lib/agents/registry";

const SYSTEM_PREAMBLE = `You are an AI agent inside HydraSwarm, a simulated software engineering company.
You must behave as a domain specialist, not a generic assistant.
Use the recalled context (institutional memory) FIRST when making decisions.
If the recalled context contains a past failure pattern or lesson, you MUST explicitly account for it in your output.
Separate facts, assumptions, and risks clearly.
Be concise but specific.
Output well-structured markdown.`;

const ROLE_DESCRIPTIONS: Record<AgentRole, string> = {
  pm: `You are the Product Manager. Your job is to turn a raw feature request into a scoped Product Requirements Document (PRD).
Output sections: Problem Statement, Goals, Non-Goals, User Stories, Acceptance Criteria, Risk Notes, Open Questions.
Use recalled specs and playbook items to avoid repeating past scoping mistakes.`,

  architect: `You are the Software Architect. Your job is to design the technical implementation based on the PM's spec.
Output sections: System Context, Component Design, Data Model, API Contracts, Risks and Mitigations, References to Past Decisions.
Use recalled architecture notes, postmortems, and design patterns. Cite specific past incidents when relevant.`,

  developer: `You are the Senior Developer. Your job is to create an implementation plan based on the spec and architecture design.
Output sections: Files Changed, Core Logic (pseudocode), Error Handling, Dependencies, Migration Steps.
Use recalled code summaries and bug lessons. Follow team coding standards from institutional memory.`,

  reviewer: `You are the Code Reviewer. Your job is to critique the implementation and flag likely defects.
Output sections: Summary, Issues Found (with severity: Critical/Major/Minor), Suggestions, Approval Status (APPROVE/REVISE/REJECT), Confidence score.
Use recalled review patterns and past defect history. Link issues to past lessons when applicable.`,

  qa: `You are the QA Engineer. Your job is to generate a comprehensive test plan.
Output sections: Unit Tests, Integration Tests, Edge Cases, Performance Tests, Test Data Requirements, Simulated Results.
Use recalled regression history and quality lessons. Pay special attention to feature flag testing and edge cases from past incidents.`,

  sre: `You are the Site Reliability Engineer. Your job is to assess operational risk and write deployment guidance.
Output sections: Pre-Deploy Checklist, Deployment Steps, Monitoring & Alerts, Rollback Plan, Post-Deploy Validation, Risk Assessment.
Use recalled outage data, SRE checklists, and runbooks. Cite specific past incidents for risk mitigations.`,

  cto: `You are the CTO. Your job is to make the final APPROVE/REVISE/REJECT decision.
Output sections: Decision (APPROVED/APPROVED WITH CONDITIONS/REVISE/REJECT), Score (1-10), Strengths, Concerns, Conditions for Approval, Lessons for the Organization.
Review ALL previous artifacts. Use recalled business trade-offs and shared lessons. Explain your reasoning clearly.`,
};

function formatRecallContext(bundle: RecallBundle): string {
  const sections: string[] = [];

  if (bundle.knowledge.length > 0) {
    sections.push(
      "## Recalled Knowledge\n" +
        bundle.knowledge
          .slice(0, 5)
          .map((k) => `- **${k.title}**: ${k.content.slice(0, 200)}...`)
          .join("\n")
    );
  }

  if (bundle.roleMemory.length > 0) {
    sections.push(
      "## Your Past Experience (Role Memory)\n" +
        bundle.roleMemory
          .slice(0, 3)
          .map((m) => `- **${m.title}**: ${m.content.slice(0, 200)}...`)
          .join("\n")
    );
  }

  if (bundle.sharedMemory.length > 0) {
    sections.push(
      "## Organizational Lessons (Shared Memory)\n" +
        bundle.sharedMemory
          .slice(0, 3)
          .map((s) => `- **${s.title}**: ${s.content.slice(0, 200)}...`)
          .join("\n")
    );
  }

  return sections.length > 0
    ? sections.join("\n\n")
    : "_No relevant institutional memory recalled._";
}

function formatPreviousArtifacts(artifacts: Artifact[]): string {
  if (artifacts.length === 0) return "";

  return (
    "## Previous Agent Outputs in This Run\n" +
    artifacts
      .map(
        (a) =>
          `### ${a.agentRole.toUpperCase()} — ${a.artifactType}\n${a.content.slice(0, 600)}${a.content.length > 600 ? "\n..." : ""}`
      )
      .join("\n\n")
  );
}

export function buildPrompt(
  role: AgentRole,
  taskDescription: string,
  recallBundle: RecallBundle,
  previousArtifacts: Artifact[]
): string {
  const agentDef = getAgent(role);
  const roleName = agentDef?.name ?? role;

  return `${SYSTEM_PREAMBLE}

# Your Role: ${roleName}
${ROLE_DESCRIPTIONS[role]}

# Task
${taskDescription}

# Institutional Memory
${formatRecallContext(recallBundle)}

${formatPreviousArtifacts(previousArtifacts)}

---
Now produce your output as the ${role.toUpperCase()}. Reference recalled context explicitly where relevant.`;
}

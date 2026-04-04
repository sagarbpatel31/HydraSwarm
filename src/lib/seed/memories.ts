export interface AgentMemorySeed {
  role: string;
  title: string;
  text: string;
}

export interface SharedMemorySeed {
  title: string;
  text: string;
}

export const SEED_AGENT_MEMORIES: AgentMemorySeed[] = [
  // PM memories
  {
    role: "pm",
    title: "Scope management lesson",
    text: "When scoping features, always define non-goals explicitly. In Q4, the notifications feature grew 3x because we didn't set boundaries early. Prefer MVPs with clear phase-2 items listed separately. Acceptance criteria must be testable — no vague language like 'should be fast'.",
  },
  {
    role: "pm",
    title: "Stakeholder alignment",
    text: "For billing-related features, always get sign-off from the finance team before spec finalization. Last time we skipped this, we had to rewrite the invoice format 2 weeks after launch.",
  },

  // Architect memories
  {
    role: "architect",
    title: "Circuit breaker mandate",
    text: "After the March 2025 payment outage, all services handling financial data MUST implement circuit breakers. This is non-negotiable. Connection pool sizes must be tuned based on load testing, not left at defaults. Reference: postmortem-payment-outage-2025.",
  },
  {
    role: "architect",
    title: "Datastore selection guidance",
    text: "PostgreSQL is the default. Only use Redis for caching/pub-sub, never as primary storage. DynamoDB was evaluated and rejected for billing due to query flexibility concerns.",
  },

  // Developer memories
  {
    role: "developer",
    title: "Code organization rules",
    text: "Functions should be under 50 lines. If a function grows beyond that, extract helpers. Use early returns to reduce nesting. Keep the happy path left-aligned. All database queries should go through the repository layer, not directly in handlers.",
  },
  {
    role: "developer",
    title: "Async patterns",
    text: "For any logging, auditing, or notification side-effects: use async event queues. Never block the main request path with synchronous writes. We learned this the hard way with audit logging in the billing service — it added 200ms per request.",
  },

  // Reviewer memories
  {
    role: "reviewer",
    title: "Common review findings",
    text: "Top 3 recurring issues in code reviews: (1) Missing error handling on external API calls — always wrap in try/catch with specific error types. (2) Hardcoded configuration values — these must come from env vars. (3) Missing input validation on API endpoints — use zod or similar schema validation.",
  },
  {
    role: "reviewer",
    title: "Review priorities",
    text: "Focus review attention on: error handling paths, authentication/authorization checks, database query efficiency, and edge cases around null/undefined values. The team warning about token handling edge cases was correct but got ignored in the notifications feature — resulted in a P2 bug.",
  },

  // QA memories
  {
    role: "qa",
    title: "Test isolation lesson",
    text: "Shared test state causes flakiness. Each test must set up and tear down its own data. Use test transactions that roll back. In Q1, 60% of our flaky tests were caused by shared database state between test suites.",
  },
  {
    role: "qa",
    title: "Feature flag testing",
    text: "Always test both the on-path AND off-path of feature flags. The notifications feature had a bug where the flag default was 'on' instead of 'off', causing unready features to reach users. QA must verify flag defaults explicitly.",
  },

  // SRE memories
  {
    role: "sre",
    title: "New service checklist",
    text: "Before any new service goes to production: (1) Health check endpoint at /health (2) Structured JSON logging with correlation IDs (3) Prometheus metrics exported (4) Circuit breaker on all external dependencies (5) Runbook documented (6) Alert thresholds configured to trigger within 2 minutes of error rate increase.",
  },
  {
    role: "sre",
    title: "Retry and backpressure lessons",
    text: "All retry logic MUST include exponential backoff with jitter. Fixed-interval retries caused traffic amplification during the March outage. Also: rate limiting must exist between internal services, not just at the API gateway.",
  },

  // CTO memories
  {
    role: "cto",
    title: "Decision framework",
    text: "When evaluating features for approval: (1) Is the scope well-defined with clear non-goals? (2) Does it have a rollback plan? (3) Were lessons from past incidents incorporated? (4) Is the testing plan comprehensive including edge cases? I will reject any feature that doesn't address known risks from our incident history.",
  },
  {
    role: "cto",
    title: "Trade-off guidance",
    text: "For Q2 2025, reliability > velocity. We need to reduce P1 incidents by 50%. If a feature introduces operational risk without mitigation, I will ask for revision. Business features are important but not at the cost of system stability.",
  },
];

export const SEED_SHARED_MEMORIES: SharedMemorySeed[] = [
  {
    title: "Q2 2025 company priority",
    text: "Company priority for Q2 2025: reliability over new features. Target: reduce P1 incidents by 50%. All teams should prioritize operational hardening, circuit breakers, and monitoring improvements over feature velocity.",
  },
  {
    title: "Payment outage organizational lesson",
    text: "ORGANIZATIONAL LESSON from March 2025 payment outage: (1) Circuit breakers are mandatory on all services handling financial data. (2) Connection pool monitoring must be in place. (3) Retry logic must use exponential backoff with jitter. (4) Internal service-to-service rate limiting is required. This applies to ALL teams, not just billing.",
  },
  {
    title: "Quality gate requirements",
    text: "Quality gate for production releases: (1) 80% test coverage minimum (2) Load testing required for services handling >100 rps (3) Feature flags must default to OFF (4) Runbook must exist before production deployment (5) All reviewer warnings must be addressed — do not ignore review feedback even if it seems minor.",
  },
];

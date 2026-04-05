import { AgentRole } from "@/types/run";

/**
 * Returns mock agent responses that adapt to the task description and improve across runs.
 * Run 1: finds issues
 * Run 2+: fixes issues using learned lessons
 */
export function getMockResponse(
  role: AgentRole,
  taskDescription: string,
  runNumber: number = 1,
  recalledLessons: string[] = []
): string {
  const hasLessons = recalledLessons.length > 0 || runNumber > 1;
  const task = taskDescription.split(" - ")[0] || taskDescription;
  const detail = taskDescription.split(" - ")[1] || "";
  const lessonNote = hasLessons
    ? `\n> **Institutional Memory Applied**: Based on ${recalledLessons.length || "previous"} recalled lessons, this output incorporates improvements from past runs.\n`
    : "";

  const responses: Record<AgentRole, () => string> = {
    pm: () => `# Product Requirements Document

## Problem Statement
${task}

${detail ? `**Context**: ${detail}\n` : ""}${lessonNote}
## Goals
- Deliver a production-ready implementation of this feature
- Ensure seamless integration with existing systems
- Meet quality and reliability standards${hasLessons ? "\n- **[Learned]** Address all issues identified in the previous run before launch" : ""}

## Non-Goals
- Complete platform redesign or re-architecture
- Changes to unrelated systems or services
- Performance optimization of existing unrelated features

## User Stories
1. As a user, I want this feature to work reliably so I can trust the platform
2. As a user, I want clear feedback when something goes wrong so I know what to do
3. As an admin, I want visibility into how this feature is being used so I can make informed decisions
4. As a developer, I want clean APIs and documentation so I can integrate quickly

## Acceptance Criteria
- Feature works end-to-end in all supported environments
- Error states handled gracefully with user-friendly messages
- 80% test coverage on new code
- Feature flag controls activation for safe rollout
- Performance impact is under 50ms added latency${hasLessons ? "\n- **[Learned]** All operations that may be slow must be asynchronous (not blocking the user experience)" : ""}

## Open Questions
- What are the expected usage volumes? (Need for capacity planning)
- Are there compliance or privacy requirements to consider?

## Risk Notes
- New features should not degrade existing system performance
- Third-party service dependencies need circuit breakers${hasLessons ? "\n- **[Learned from Run " + (runNumber - 1) + "]** Previous implementation had synchronous operations that caused latency — must use async patterns" : ""}
`,

    architect: () => `# Technical Design Document

## System Context
${task} — this integrates with our existing platform infrastructure.
${lessonNote}
## Component Design

### Core Service
- New service module handling the primary business logic
- RESTful API endpoints following our standard envelope format
- Event-driven architecture for asynchronous processing
${hasLessons ? "- **[Learned]** All external calls wrapped with circuit breakers (mandatory after past outages)\n- **[Learned]** Processing that takes >100ms must be async via event queue\n" : ""}
### Data Layer
- PostgreSQL for persistent storage (our standard datastore)
- Redis for caching and real-time operations
- Database migrations for schema changes (zero-downtime, additive only)

### Integration Layer
- Event queue (Redis pub/sub) for async processing
- Webhook support for external system notifications
- API versioning for backward compatibility

## Data Model
\`\`\`sql
-- Core feature table
CREATE TABLE feature_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feature_data_user ON feature_data(user_id);
CREATE INDEX idx_feature_data_created ON feature_data(created_at);
\`\`\`

## Risks and Mitigations
| Risk | Mitigation |
|------|-----------|
| Third-party service downtime | Circuit breaker with fallback behavior |
| Database performance under load | Connection pool tuning + read replicas |
| Data consistency during failures | Idempotent operations + retry with backoff |
${hasLessons ? "| Synchronous bottleneck (past issue) | **[Learned]** Async event queue for all heavy processing |\n| Missing error handling (past issue) | **[Learned]** Comprehensive error handling on all paths |" : ""}

## References to Past Decisions
- Company engineering standards: 80% coverage, feature flags, structured logging${hasLessons ? "\n- **Run " + (runNumber - 1) + " lessons**: Async processing mandate, circuit breaker requirements" : ""}
`,

    developer: () => `# Implementation Plan

## Files Changed

### New Files
- \`src/services/featureService.ts\` — Core business logic
- \`src/controllers/featureController.ts\` — API endpoint handlers
- \`src/models/featureModel.ts\` — Database models and queries
- \`src/events/featureEvents.ts\` — ${hasLessons ? "**Async** " : ""}event processing
- \`src/migrations/add_feature_tables.sql\` — Database migration
- \`src/tests/feature.test.ts\` — Unit and integration tests
${hasLessons ? "- `src/lib/circuitBreaker.ts` — **[Learned]** Circuit breaker wrapper for external calls\n" : ""}
### Modified Files
- \`src/routes/index.ts\` — Register new API endpoints
- \`src/config/index.ts\` — Add feature configuration from env vars
- \`src/app.ts\` — Initialize new service on startup

## Core Logic

### Service Layer
\`\`\`pseudo
class FeatureService:
  constructor(db, ${hasLessons ? "eventQueue, circuitBreaker" : "cache"}):
    this.db = db
    ${hasLessons ? "this.queue = eventQueue  // Learned: async processing\n    this.breaker = circuitBreaker  // Learned: fault tolerance" : "this.cache = cache"}

  async create(userId, data):
    validate(data)  // Input validation with schema
    record = await this.db.insert(data)
    ${hasLessons ? "await this.queue.publish('feature.created', record)  // Async!" : "await this.processSync(record)  // Direct processing"}
    return record

  async getByUser(userId):
    ${hasLessons ? "cached = await this.cache.get(userId)\n    if cached: return cached" : ""}
    results = await this.db.findByUser(userId)
    return results
\`\`\`

## Error Handling
- All database operations wrapped in try/catch with typed errors
- API responses use standard error envelope: \`{ error: { code, message } }\`
- Failed operations return appropriate HTTP status codes${hasLessons ? "\n- **[Learned]** Circuit breaker on ALL external service calls\n- **[Learned]** Retry with exponential backoff + jitter for transient failures" : ""}

## Dependencies
- No new external dependencies required
- Uses existing PostgreSQL and Redis infrastructure
`,

    reviewer: () => {
      if (hasLessons) {
        return `# Code Review

## Summary
The implementation is **significantly improved** over the previous iteration. Key lessons from past runs have been incorporated, resulting in a more robust and production-ready design.
${lessonNote}
## Issues Found

### Minor
1. **Cache invalidation strategy not specified**: When data is updated, the cache should be invalidated. Add cache invalidation logic to the update and delete methods.
2. **Missing request rate limiting on new endpoints**: New API endpoints should have rate limiting configured at the gateway level.

## Improvements Over Previous Runs
- **[Resolved]** Processing is now asynchronous via event queue (was synchronous — caused latency)
- **[Resolved]** Circuit breakers added on external calls (was missing — could cascade failures)
- **[Resolved]** Comprehensive error handling on all code paths (was incomplete)
- **[Resolved]** Input validation added with schema (was trusting user input)

## Approval Status
**APPROVE** — The implementation addresses all critical issues from the previous run. Remaining items are minor and can be handled during development.

## Confidence: 0.92
`;
      }
      return `# Code Review

## Summary
The implementation plan covers the core functionality but has several issues that need attention before production deployment.

## Issues Found

### Critical
1. **Synchronous processing blocks the request**: The \`processSync\` call in the service layer runs in the request path. For any operation taking >100ms, this will degrade user experience.
   - **Suggested fix**: Move to async event queue processing.

### Major
2. **No circuit breaker on external calls**: If a downstream service is slow or down, requests will pile up and potentially crash the server.
   - **Suggested fix**: Add circuit breaker pattern with fallback behavior.

3. **Missing input validation**: User data is passed directly to the database without validation. This is a security risk (SQL injection, invalid data).
   - **Suggested fix**: Add schema validation (e.g., Zod) on all API inputs.

### Minor
4. **No caching layer**: Repeated queries for the same data hit the database every time.
5. **Missing pagination on list endpoints**: Could return unbounded result sets.

## Approval Status
**REVISE** — Address the critical and major issues before proceeding.

## Confidence: 0.76
`;
    },

    qa: () => `# Test Plan

## Unit Tests
- Service creates records correctly with valid input
- Service rejects invalid input with appropriate errors
- Service handles database connection failures gracefully
- API returns correct HTTP status codes for all scenarios${hasLessons ? "\n- **[Learned]** Async event processing delivers events within 5 seconds\n- **[Learned]** Circuit breaker opens after 3 consecutive failures" : ""}

## Integration Tests
- End-to-end: API request → service → database → response
- Event processing pipeline works correctly
- Database migration applies cleanly and rolls back safely
- Feature flag enables/disables feature correctly

## Edge Cases
- Very large input data (>1MB payload)
- Concurrent requests from the same user
- Database connection drops mid-transaction
- Unicode and special characters in user input
- **Feature flag off-path**: Feature disabled still returns graceful response
- **Feature flag default**: Verify flag defaults to OFF for safe rollout

## Performance Tests
- API responds in <200ms at p99 under normal load
- ${hasLessons ? "Async processing adds <5ms to request path (event queue)" : "Processing completes within acceptable time"}
- System handles 500 concurrent users without degradation

## Simulated Results
- Unit tests: ${hasLessons ? "22/22" : "18/18"} passing
- Integration tests: 8/8 passing
- Edge case tests: ${hasLessons ? "7/7 passing" : "5/7 passing (2 FAIL)"}
- Performance tests: ${hasLessons ? "4/4 passing" : "3/4 passing (1 FAIL)"}
${hasLessons ? "\n**All previous failures resolved.** Async processing fixed the latency test. Input validation fixed the edge case failures.\n" : "\n### Failing Tests\n- **FAIL: concurrent_user_race_condition** — Two concurrent requests can create duplicate records\n- **FAIL: large_payload_timeout** — 1MB payload causes timeout in synchronous processing path\n- **FAIL: p99_latency_exceeded** — Synchronous processing pushes p99 above 200ms\n"}`,

    sre: () => `# Operational Risk Assessment & Runbook

## Pre-Deploy Checklist
- [${hasLessons ? "x" : " "}] Health check endpoint includes new service status
- [${hasLessons ? "x" : " "}] Circuit breaker configured on external dependencies
- [${hasLessons ? "x" : " "}] Connection pool size tuned for expected load
- [ ] Feature flag defaults to OFF
- [ ] Monitoring dashboards updated
- [ ] Runbook documented and reviewed
${hasLessons ? "\n**Items marked [x] were pre-verified based on lessons from previous deployments.**\n" : ""}
## Deployment Steps
1. Deploy database migration — zero-downtime, additive schema change
2. Deploy backend service with feature flag OFF
3. Verify health checks pass on all instances
4. Enable feature flag for 5% of users (canary)
5. Monitor error rates and latency for 15 minutes
6. Gradually roll out: 5% → 25% → 50% → 100%

## Monitoring & Alerts
| Metric | Threshold | Action |
|--------|-----------|--------|
| Error rate | >1% over 2 minutes | Page on-call engineer |
| API p99 latency | >500ms | Investigate, possible rollback |
| Database connection usage | >80% | Scale connection pool |
| Event queue depth | >5,000 events | Scale consumers |
| Feature flag errors | Any occurrence | Disable flag, investigate |

## Rollback Plan
1. **Fastest**: Disable feature flag → feature immediately hidden from users
2. **If data issue**: Rollback database migration (safe — additive only)
3. **Nuclear**: Redeploy previous service version (< 5 minutes)

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Service latency increase | ${hasLessons ? "Low" : "Medium"} | Medium | ${hasLessons ? "**[Learned]** Async processing + circuit breaker" : "Needs async processing (currently synchronous)"} |
| Data loss during failure | Low | High | Idempotent operations + event replay |
| Downstream service outage | Low | Medium | ${hasLessons ? "**[Learned]** Circuit breaker with graceful fallback" : "Needs circuit breaker (currently missing)"} |

**Overall risk: ${hasLessons ? "LOW" : "MEDIUM"}** — ${hasLessons ? "Previous lessons applied. Pre-verified checklist items reduce deployment risk." : "Recommend addressing reviewer feedback before deployment."}
`,

    cto: () => {
      const score = hasLessons ? Math.min(9, 7 + runNumber - 1) : 7;
      const decision = hasLessons ? "APPROVED" : "APPROVED WITH CONDITIONS";

      return `# CTO Decision

## Decision: ${decision}

## Score: ${score}/10
${lessonNote}
## Strengths
1. **Clear requirements and acceptance criteria** — The PM defined testable criteria, not vague goals.
2. **Standard architecture patterns** — Uses our established tech stack (PostgreSQL, Redis, event queues).
3. **Feature flag with canary rollout** — Proper risk mitigation for user-facing changes.${hasLessons ? "\n4. **[Improvement]** Async processing pattern — Previous run's latency issue has been resolved.\n5. **[Improvement]** Circuit breakers on all external calls — Fault tolerance properly implemented.\n6. **[Improvement]** Comprehensive input validation — Security risk from previous run addressed." : ""}

## Concerns
${hasLessons
  ? "1. **Minor**: Cache invalidation strategy should be documented.\n2. **Minor**: New endpoints need rate limiting at the gateway.\n\nAll critical and major issues from the previous run have been resolved."
  : "1. **Critical**: Synchronous processing will cause latency issues under load. Must move to async.\n2. **Major**: No circuit breakers — a downstream failure could cascade to our service.\n3. **Major**: Missing input validation is a security risk.\n4. **Minor**: No caching strategy for frequently accessed data."}

## Conditions for Approval
${hasLessons
  ? "1. Document cache invalidation strategy\n2. Add rate limiting to new endpoints\n\nThese are minor items that can be addressed during implementation sprint."
  : "1. Refactor processing to use async event queue\n2. Add circuit breakers on all external service calls\n3. Add input validation with schema\n4. Fix the 3 failing tests (race condition, timeout, latency)"}

## Lessons for the Organization
${hasLessons
  ? "- **Institutional learning is working.** The team proactively addressed all issues from Run " + (runNumber - 1) + " without being asked.\n- **New lesson**: Cache invalidation must be part of every design that introduces caching.\n- **New lesson**: Rate limiting should be added to the gateway config for any new API endpoints.\n- Score improved from Run " + (runNumber - 1) + " because past lessons were applied. This validates our memory-driven development process."
  : "- **New lesson**: All processing that takes >100ms should be async — never synchronous in the request path.\n- **New lesson**: Circuit breakers are mandatory on every external service dependency, not optional.\n- **New lesson**: Input validation must be the first step in every API handler, before any business logic.\n- The team shows good fundamentals but needs to be more disciplined about production-readiness patterns."}
`;
    },
  };

  return responses[role]();
}

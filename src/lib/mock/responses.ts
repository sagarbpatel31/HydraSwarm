import { AgentRole } from "@/types/run";

/**
 * Returns mock agent responses that vary based on run number.
 * Run 1: baseline with some issues found
 * Run 2+: improved because of learned lessons
 */
export function getMockResponse(
  role: AgentRole,
  taskDescription: string,
  runNumber: number = 1,
  recalledLessons: string[] = []
): string {
  const hasLessons = recalledLessons.length > 0 || runNumber > 1;
  const lessonBlock = hasLessons
    ? `\n\n> **Institutional Memory Applied**: Based on ${recalledLessons.length || "previous"} recalled lessons, this output incorporates improvements from past runs.\n`
    : "";

  const responses: Record<AgentRole, () => string> = {
    pm: () => `# Product Requirements Document

## Problem Statement
${taskDescription}
${lessonBlock}
## Goals
- Implement the requested feature with production-grade quality
- Ensure compatibility with existing billing infrastructure
- Meet Q2 reliability targets${hasLessons ? "\n- **[Learned]** Ensure rate limiting is applied at BOTH gateway and service layer (past inconsistency)" : ""}

## Non-Goals
- Full redesign of the billing architecture
- Changes to the authentication system
- Migration of existing data

## User Stories
1. As an API consumer, I want rate limiting applied consistently so that no single client can overwhelm the service
2. As an operations engineer, I want audit logs for all billing API mutations so that I can trace any transaction
3. As a developer, I want clear error responses when rate-limited so that I can implement proper retry logic

## Acceptance Criteria
- Rate limiting returns 429 with Retry-After header
- Audit logs capture: user, action, timestamp, request ID, outcome
- All audit logging is asynchronous (not blocking the request path)
- 80% test coverage on new code
- Feature flag controls rate limiting activation${hasLessons ? "\n- **[Learned]** Rate limiter state must be Redis-backed, not in-memory (multi-instance correctness)" : ""}

## Open Questions
- What rate limit thresholds should we use? (Suggesting 100 req/min per API key)
- Should audit logs include request/response bodies or just metadata?

## Risk Notes
- Based on past incidents, rate limiting must be applied at both gateway AND service layer
- Audit logging must be async to avoid the latency issues seen in the notifications feature${hasLessons ? "\n- **[Learned from Run " + (runNumber - 1) + "]** Audit buffer flush must use exponential backoff with jitter" : ""}
`,

    architect: () => `# Technical Design Document

## System Context
This feature adds rate limiting and audit logging to the billing API, which currently handles ~500 rps at peak.
${lessonBlock}
## Component Design

### Rate Limiting
- **Layer 1 — API Gateway**: Token bucket rate limiter at the gateway level (nginx/envoy)
- **Layer 2 — Service Middleware**: Per-route rate limiting middleware in the billing service
- Both layers must be present per our API design guide (rate limiting at only one layer is insufficient)
- Configuration stored in environment variables, not hardcoded
${hasLessons ? "- **[Learned]** Rate limiter state MUST be Redis-backed for distributed consistency across pods. In-memory state caused race conditions in prior implementation.\n" : ""}
### Audit Logging
- **Async event queue** using Redis pub/sub → dedicated audit log consumer
- NOT synchronous in the request path (lesson from notifications feature: sync logging added 200ms)
- Audit events: { user_id, action, resource, timestamp, request_id, outcome, metadata }
- Storage: PostgreSQL audit_logs table with 90-day retention
${hasLessons ? "- **[Learned]** Buffer flush strategy must use exponential backoff with jitter to prevent thundering herd when circuit breaker closes\n" : ""}
### Circuit Breaker
- Circuit breaker on Redis connection for audit queue (per March 2025 postmortem mandate)
- Fallback: buffer audit events in memory with periodic flush

## Data Model
\`\`\`sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(255) NOT NULL,
  request_id VARCHAR(255) NOT NULL,
  outcome VARCHAR(50) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
\`\`\`

## Risks and Mitigations
| Risk | Mitigation |
|------|-----------|
| Redis unavailability for audit queue | Circuit breaker + in-memory buffer fallback |
| Rate limit bypass via multiple API keys | Per-account aggregate rate limiting |
| Connection pool exhaustion under load | Tuned pool sizes based on load testing (lesson from payment outage) |
${hasLessons ? "| In-memory rate limiter race condition | **[Learned]** Redis-backed state for distributed consistency |" : ""}

## References to Past Decisions
- March 2025 postmortem: circuit breaker mandate, connection pool tuning
- Notifications feature: async logging pattern validated
- API design guide: dual-layer rate limiting requirement${hasLessons ? "\n- **Run " + (runNumber - 1) + " lessons**: Redis-backed rate limiting, backoff with jitter" : ""}
`,

    developer: () => `# Implementation Plan

## Files Changed

### New Files
- \`src/middleware/rateLimiter.ts\` — Token bucket rate limiter middleware${hasLessons ? " **(Redis-backed per learned lesson)**" : ""}
- \`src/services/auditLogger.ts\` — Async audit logging service
- \`src/queue/auditConsumer.ts\` — Redis queue consumer for audit events
- \`src/migrations/001_create_audit_logs.sql\` — Database migration
- \`src/tests/rateLimiter.test.ts\` — Rate limiter unit tests
- \`src/tests/auditLogger.test.ts\` — Audit logger unit tests
${hasLessons ? "- `src/lib/backoff.ts` — **[Learned]** Exponential backoff with jitter utility\n" : ""}
### Modified Files
- \`src/routes/billing.ts\` — Add rate limiter middleware to routes
- \`src/config/index.ts\` — Add rate limit and audit config from env vars
- \`src/app.ts\` — Initialize audit consumer on startup

## Core Logic

### Rate Limiter (${hasLessons ? "Redis-Backed" : "Token Bucket"})
\`\`\`pseudo
class ${hasLessons ? "Redis" : ""}TokenBucketRateLimiter:
  constructor(${hasLessons ? "redisClient, " : ""}maxTokens, refillRate, keyExtractor):
    ${hasLessons ? "this.redis = redisClient  // Learned: must be distributed" : "this.buckets = new Map()"}

  middleware(req, res, next):
    key = keyExtractor(req)  // API key or user ID
    bucket = ${hasLessons ? "await this.redis.get(key)" : "getBucket(key)"}
    if bucket.tryConsume():
      next()
    else:
      res.status(429).json({
        error: "RATE_LIMIT_EXCEEDED",
        retryAfter: bucket.nextRefillSeconds()
      })
\`\`\`

### Audit Logger (Async${hasLessons ? " with Backoff" : ""})
\`\`\`pseudo
class AuditLogger:
  constructor(redisClient, circuitBreaker):
    this.queue = redisClient
    this.breaker = circuitBreaker
    this.buffer = []

  async log(event):
    if this.breaker.isOpen():
      this.buffer.push(event)
      return
    try:
      await this.queue.publish("audit_events", event)
    catch:
      this.breaker.recordFailure()
      this.buffer.push(event)

  async flushBuffer():
    ${hasLessons ? "// Learned: use exponential backoff with jitter\n    for event in this.buffer:\n      await backoffWithJitter(() => this.queue.publish(event))" : "// Periodic flush of buffered events when circuit closes"}
\`\`\`

## Error Handling
- Rate limiter: graceful degradation (allow traffic) if state store is unavailable
- Audit logger: buffer events locally if Redis is down; flush when reconnected
- All external calls wrapped in try/catch with typed errors
`,

    reviewer: () => {
      if (hasLessons) {
        return `# Code Review

## Summary
The implementation plan for rate limiting and audit logging is **significantly improved** compared to the previous iteration. Key lessons from past runs have been incorporated, resulting in fewer critical issues.
${lessonBlock}
## Issues Found

### Major
1. **Connection pool size not specified**: While the architecture mentions tuning, the implementation plan doesn't include specific configuration values.
   - **Suggested fix**: Add connection pool config to \`src/config/index.ts\` with documented defaults.

### Minor
2. **Missing correlation ID in audit events**: Audit events should include the request correlation ID for cross-service tracing.
3. **Rate limit config should be per-route**: Different billing endpoints may need different thresholds.

## Improvements Over Previous Runs
- **[Resolved]** Rate limiter is now Redis-backed (was in-memory — caused race conditions)
- **[Resolved]** Audit buffer flush now uses exponential backoff with jitter (was fixed-interval — caused thundering herd)
- **[Resolved]** Gateway + service layer rate limiting is specified (was single-layer only)

## Approval Status
**APPROVE** — The major lesson-driven improvements have been addressed. Remaining issues are minor and can be fixed during implementation.

## Confidence: 0.91
`;
      }
      return `# Code Review

## Summary
The implementation plan for rate limiting and audit logging is generally solid and follows team standards. The async audit logging pattern is correct. However, there are several issues that need attention before approval.

## Issues Found

### Critical
1. **Rate limiter uses in-memory state**: Token bucket state is in-memory per instance. In a multi-pod deployment, users could exceed limits by hitting different pods.
   - **Suggested fix**: Use Redis-backed rate limiter state for distributed consistency.

### Major
2. **No exponential backoff in audit buffer flush**: When the circuit breaker closes and buffered events flush, there's no backoff strategy. This could cause a thundering herd.
   - **Suggested fix**: Implement gradual flush with exponential backoff + jitter.
   - **Linked past lesson**: Payment outage — retry without jitter caused traffic amplification.

3. **Missing rate limiter at gateway layer**: Implementation only shows middleware-level. Per API design guide, must exist at BOTH layers.

### Minor
4. **Hardcoded rate limit values**: Config mentions env vars but pseudocode shows hardcoded constructor params.
5. **Missing correlation ID in audit events**: Needed for cross-service tracing.

## Approval Status
**REVISE** — Address the critical and major issues before proceeding.

## Confidence: 0.78
`;
    },

    qa: () => `# Test Plan

## Unit Tests

### Rate Limiter Tests
- Token bucket correctly limits after max tokens consumed
- Token bucket refills at configured rate
- Rate limiter returns 429 with correct Retry-After header
- Rate limiter extracts correct key from request (API key, user ID)
- Rate limiter allows traffic when under limit
${hasLessons ? "- **[Learned]** Redis-backed state is consistent across multiple instances\n- **[Learned]** Concurrent requests at boundary don't exceed limit (race condition regression)\n" : "- Graceful degradation when state store is unavailable\n"}
### Audit Logger Tests
- Audit event published to Redis queue successfully
- Circuit breaker opens after configured failure threshold
- Events buffered locally when circuit breaker is open
- Buffer flushed when circuit breaker closes
${hasLessons ? "- **[Learned]** Buffer flush uses exponential backoff with jitter (no thundering herd)\n" : "- Audit event schema validation\n"}
## Integration Tests
- End-to-end: API request → rate limit check → audit log written
- Rate limiting works across multiple sequential requests
- Audit consumer processes events from Redis queue to PostgreSQL

## Edge Cases
- Rate limit boundary: exactly at limit (should allow) vs one over (should reject)
- Concurrent requests from same API key at limit boundary
- Redis connection drops mid-operation
- **Feature flag off-path**: Rate limiting disabled via feature flag — verify requests pass through
- **Feature flag default**: Verify flag defaults to OFF

## Simulated Results
- Unit tests: ${hasLessons ? "28/28" : "24/24"} passing
- Integration tests: 8/8 passing
- Edge case tests: ${hasLessons ? "7/7 passing" : "6/7 passing (1 FAIL: concurrent boundary race condition)"}
- Performance tests: 4/4 passing
${hasLessons ? "\n**All previous regression tests now passing.** The Redis-backed rate limiter resolved the concurrent boundary race condition from Run " + (runNumber - 1) + ".\n" : "\n### Failing Test\n**FAIL: concurrent_boundary_race_condition** — In-memory token bucket race condition. Redis-backed state would fix this.\n"}`,

    sre: () => `# Operational Risk Assessment & Runbook

## Pre-Deploy Checklist
- [${hasLessons ? "x" : " "}] Circuit breaker configured on Redis connection
- [${hasLessons ? "x" : " "}] Connection pool size for PostgreSQL tuned based on load test
- [${hasLessons ? "x" : " "}] Health check endpoint includes Redis connectivity status
- [ ] Feature flag \`billing.ratelimit.enabled\` defaults to OFF
- [ ] Monitoring dashboards updated with new metrics
- [ ] Runbook reviewed and approved
${hasLessons ? "\n**Note**: Items marked [x] were flagged in previous runs and have been pre-verified.\n" : ""}
## Deployment Steps
1. Deploy database migration (audit_logs table) — zero-downtime, additive only
2. Deploy audit consumer service
3. Deploy billing service with rate limiter and audit logger (feature flagged OFF)
4. Verify health checks pass on all pods
5. Enable feature flag for 5% of traffic (canary)
6. Monitor error rates and latency for 15 minutes
7. Gradually increase to 25% → 50% → 100%

## Monitoring & Alerts
| Metric | Threshold | Action |
|--------|-----------|--------|
| 429 response rate | >10% of total | Investigate rate limit config |
| Audit queue depth | >10,000 events | Scale audit consumer |
| Audit consumer lag | >60 seconds | Page on-call SRE |
| Redis circuit breaker open | Any occurrence | Alert — audit events buffering |
| Billing API p99 latency | >200ms | Investigate, possible rollback |
| Error rate | >1% over 2 minutes | Page on-call |

## Rollback Plan
1. Disable feature flag → immediately stops rate limiting
2. Stop audit consumer pods if problematic
3. Circuit breaker activates automatically for Redis failures
4. **Nuclear rollback**: Redeploy previous version (< 5 minutes)

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Redis outage | Low | Medium | Circuit breaker + memory buffer |
| Rate limiter latency | Low | Medium | Benchmarked at <5ms |
| Connection pool exhaustion | ${hasLessons ? "Low (tuned)" : "Medium"} | High | ${hasLessons ? "**[Learned]** Tuned + circuit breaker" : "Needs tuning + circuit breaker"} |

**Overall risk: ${hasLessons ? "LOW" : "MEDIUM"}** — ${hasLessons ? "Previous lessons applied, pre-verified checklist items." : "Proceed with canary deployment and staged rollout."}
`,

    cto: () => {
      const score = hasLessons ? Math.min(9, 7 + runNumber - 1) : 7;
      const decision = hasLessons ? "APPROVED" : "APPROVED WITH CONDITIONS";

      return `# CTO Decision

## Decision: ${decision}

## Score: ${score}/10
${lessonBlock}
## Strengths
1. **Async audit logging pattern is correct** — The team learned from the notifications feature debacle and is not repeating the synchronous logging mistake.
2. **Circuit breaker included** — This addresses our mandatory requirement from the March 2025 postmortem.
3. **Dual-layer rate limiting** — Both gateway and service-level, per our API design guide.
4. **Feature flag with canary rollout** — Proper deployment risk mitigation.
${hasLessons ? "5. **[Improvement]** Redis-backed rate limiter state — Previous run's race condition has been resolved.\n6. **[Improvement]** Backoff with jitter on audit flush — Thundering herd risk eliminated.\n" : ""}
## Concerns
${hasLessons
  ? "1. **Minor**: Connection pool sizes should be documented with specific values.\n2. **Minor**: Correlation IDs should be added to audit events for traceability.\n\nAll critical and major issues from the previous run have been addressed."
  : "1. **Critical**: Rate limiter uses in-memory state — race condition risk in multi-pod deployment. MUST fix.\n2. **Major**: Audit buffer flush has no backoff strategy — thundering herd risk.\n3. **Major**: QA found a failing concurrent boundary test — must be green before merge."}

## Conditions for Approval
${hasLessons
  ? "1. Add specific connection pool configuration values\n2. Add correlation IDs to audit events\n\nThese are minor items that can be addressed during implementation."
  : "1. Switch to Redis-backed rate limiter state\n2. Add exponential backoff with jitter to audit buffer flush\n3. Fix the failing concurrent boundary test\n4. All reviewer comments addressed"}

## Lessons for the Organization
${hasLessons
  ? "- The team is demonstrating strong institutional learning. Critical issues from Run " + (runNumber - 1) + " were proactively addressed.\n- **New lesson**: Connection pool configurations should be documented explicitly, not left as 'to be tuned'.\n- The improvement from Run " + (runNumber - 1) + " to Run " + runNumber + " validates that our memory system is working."
  : "- **New lesson**: Any in-memory state used for rate limiting must be evaluated for multi-instance correctness during architecture review.\n- **New lesson**: Audit buffer flush must use exponential backoff with jitter to prevent thundering herd.\n- The team is demonstrating good institutional learning from past incidents."}
`;
    },
  };

  return responses[role]();
}

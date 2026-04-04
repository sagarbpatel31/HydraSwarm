import { AgentRole } from "@/types/run";

export function getMockResponse(
  role: AgentRole,
  taskDescription: string
): string {
  const responses: Record<AgentRole, string> = {
    pm: `# Product Requirements Document

## Problem Statement
${taskDescription}

## Goals
- Implement the requested feature with production-grade quality
- Ensure compatibility with existing billing infrastructure
- Meet Q2 reliability targets

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
- Feature flag controls rate limiting activation

## Open Questions
- What rate limit thresholds should we use? (Suggesting 100 req/min per API key)
- Should audit logs include request/response bodies or just metadata?

## Risk Notes
- Based on past incidents, rate limiting must be applied at both gateway AND service layer
- Audit logging must be async to avoid the latency issues seen in the notifications feature
`,

    architect: `# Technical Design Document

## System Context
This feature adds rate limiting and audit logging to the billing API, which currently handles ~500 rps at peak.

## Component Design

### Rate Limiting
- **Layer 1 — API Gateway**: Token bucket rate limiter at the gateway level (nginx/envoy)
- **Layer 2 — Service Middleware**: Per-route rate limiting middleware in the billing service
- Both layers must be present per our API design guide (rate limiting at only one layer is insufficient)
- Configuration stored in environment variables, not hardcoded

### Audit Logging
- **Async event queue** using Redis pub/sub → dedicated audit log consumer
- NOT synchronous in the request path (lesson from notifications feature: sync logging added 200ms)
- Audit events: { user_id, action, resource, timestamp, request_id, outcome, metadata }
- Storage: PostgreSQL audit_logs table with 90-day retention

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

## References to Past Decisions
- March 2025 postmortem: circuit breaker mandate, connection pool tuning
- Notifications feature: async logging pattern validated
- API design guide: dual-layer rate limiting requirement
`,

    developer: `# Implementation Plan

## Files Changed

### New Files
- \`src/middleware/rateLimiter.ts\` — Token bucket rate limiter middleware
- \`src/services/auditLogger.ts\` — Async audit logging service
- \`src/queue/auditConsumer.ts\` — Redis queue consumer for audit events
- \`src/migrations/001_create_audit_logs.sql\` — Database migration
- \`src/tests/rateLimiter.test.ts\` — Rate limiter unit tests
- \`src/tests/auditLogger.test.ts\` — Audit logger unit tests

### Modified Files
- \`src/routes/billing.ts\` — Add rate limiter middleware to routes
- \`src/config/index.ts\` — Add rate limit and audit config from env vars
- \`src/app.ts\` — Initialize audit consumer on startup

## Core Logic

### Rate Limiter (Token Bucket)
\`\`\`pseudo
class TokenBucketRateLimiter:
  constructor(maxTokens, refillRate, keyExtractor):
    this.buckets = new Map()

  middleware(req, res, next):
    key = keyExtractor(req)  // API key or user ID
    bucket = getBucket(key)
    if bucket.tryConsume():
      next()
    else:
      res.status(429).json({
        error: "RATE_LIMIT_EXCEEDED",
        retryAfter: bucket.nextRefillSeconds()
      })
      res.setHeader("Retry-After", bucket.nextRefillSeconds())
\`\`\`

### Audit Logger (Async)
\`\`\`pseudo
class AuditLogger:
  constructor(redisClient, circuitBreaker):
    this.queue = redisClient
    this.breaker = circuitBreaker
    this.buffer = []  // fallback buffer

  async log(event):
    if this.breaker.isOpen():
      this.buffer.push(event)  // fallback
      return
    try:
      await this.queue.publish("audit_events", event)
    catch:
      this.breaker.recordFailure()
      this.buffer.push(event)

  async flushBuffer():
    // Periodic flush of buffered events when circuit closes
\`\`\`

## Error Handling
- Rate limiter: graceful degradation (allow traffic) if state store is unavailable
- Audit logger: buffer events locally if Redis is down; flush when reconnected
- All external calls wrapped in try/catch with typed errors

## Dependencies
- \`ioredis\` for Redis pub/sub
- \`opossum\` for circuit breaker implementation
- No new database dependencies (using existing PostgreSQL)
`,

    reviewer: `# Code Review

## Summary
The implementation plan for rate limiting and audit logging is generally solid and follows team standards. The async audit logging pattern is correct (avoiding the sync logging mistake from the notifications feature). However, there are several issues that need attention before approval.

## Issues Found

### Critical
1. **Missing rate limiter at service layer**: The implementation only shows middleware-level rate limiting. Per our API design guide, rate limiting must exist at BOTH the gateway and service/middleware layer. The gateway configuration is not specified.
   - **Suggested fix**: Add gateway-level rate limiting config (nginx/envoy) alongside the middleware implementation.

### Major
2. **No exponential backoff in audit buffer flush**: When the circuit breaker closes and buffered events flush, there's no backoff strategy. This could cause a thundering herd of audit writes.
   - **Suggested fix**: Implement gradual flush with exponential backoff + jitter (per March 2025 postmortem lessons).
   - **Linked past lesson**: Payment outage — retry without jitter caused traffic amplification.

3. **Rate limiter state not shared across instances**: Token bucket state is in-memory per instance. In a multi-pod deployment, users could exceed limits by hitting different pods.
   - **Suggested fix**: Use Redis-backed rate limiter state for distributed consistency.

### Minor
4. **Hardcoded rate limit values in pseudocode**: The config mentions env vars but the pseudocode shows hardcoded constructor params. Ensure all values come from configuration.

5. **Missing correlation ID in audit events**: Audit events should include the request correlation ID for tracing across services.

## Approval Status
**REVISE** — Address the critical and major issues before proceeding. The minor issues can be fixed during implementation.

## Confidence: 0.78
`,

    qa: `# Test Plan

## Unit Tests

### Rate Limiter Tests
- Token bucket correctly limits after max tokens consumed
- Token bucket refills at configured rate
- Rate limiter returns 429 with correct Retry-After header
- Rate limiter extracts correct key from request (API key, user ID)
- Rate limiter allows traffic when under limit
- Graceful degradation when state store is unavailable

### Audit Logger Tests
- Audit event published to Redis queue successfully
- Circuit breaker opens after configured failure threshold
- Events buffered locally when circuit breaker is open
- Buffer flushed when circuit breaker closes
- Audit event schema validation (all required fields present)

## Integration Tests
- End-to-end: API request → rate limit check → audit log written
- Rate limiting works across multiple sequential requests
- Audit consumer processes events from Redis queue to PostgreSQL
- Database migration creates correct schema and indexes

## Edge Cases
- Rate limit boundary: exactly at limit (should allow) vs one over (should reject)
- Concurrent requests from same API key at limit boundary
- Audit logger handles malformed events without crashing
- Redis connection drops mid-operation
- **Feature flag off-path**: Rate limiting disabled via feature flag — verify requests pass through
- **Feature flag default**: Verify flag defaults to OFF (learned from notifications feature bug)

## Performance Tests
- Rate limiter adds <5ms latency per request
- Audit logging (async) adds <2ms to request path
- System handles 500 rps with rate limiting enabled
- Audit consumer processes backlog within 30 seconds

## Test Data Requirements
- 5 API keys with different rate limit tiers
- Pre-populated audit_logs table for query tests
- Redis instance for integration tests (not mocked)

## Simulated Results
- Unit tests: 24/24 passing
- Integration tests: 8/8 passing
- Edge case tests: 6/7 passing (1 FAIL: concurrent boundary race condition detected)
- Performance tests: 4/4 passing

### Failing Test Detail
**FAIL: concurrent_boundary_race_condition**
When 10 concurrent requests arrive at the exact rate limit boundary, 2 requests occasionally pass when only 1 should. This is the in-memory token bucket race condition the reviewer flagged — Redis-backed state would fix this.
`,

    sre: `# Operational Risk Assessment & Runbook

## Pre-Deploy Checklist
- [ ] Circuit breaker configured on Redis connection with sensible thresholds
- [ ] Connection pool size for PostgreSQL tuned based on load test (NOT defaults)
- [ ] Health check endpoint includes Redis connectivity status
- [ ] Feature flag \`billing.ratelimit.enabled\` defaults to OFF
- [ ] Monitoring dashboards updated with new metrics
- [ ] Runbook reviewed and approved

## Deployment Steps
1. Deploy database migration (audit_logs table) — zero-downtime, additive only
2. Deploy audit consumer service (can run idle until events flow)
3. Deploy billing service with rate limiter and audit logger (feature flagged OFF)
4. Verify health checks pass on all pods
5. Enable feature flag for 5% of traffic (canary)
6. Monitor error rates and latency for 15 minutes
7. Gradually increase to 25% → 50% → 100%
8. Verify audit logs are flowing to PostgreSQL

## Monitoring & Alerts
| Metric | Threshold | Action |
|--------|-----------|--------|
| 429 response rate | >10% of total requests | Investigate rate limit config |
| Audit queue depth | >10,000 events | Scale audit consumer |
| Audit consumer lag | >60 seconds | Page on-call SRE |
| Redis circuit breaker open | Any | Alert — audit events buffering locally |
| Billing API p99 latency | >200ms (current baseline: 45ms) | Investigate, possible rollback |
| Error rate | >1% over 2 minutes | Page on-call (per postmortem action item) |

## Rollback Plan
1. Disable feature flag \`billing.ratelimit.enabled\` → immediately stops rate limiting
2. If audit consumer is problematic: stop consumer pods, events buffer in Redis
3. If Redis is problematic: circuit breaker activates automatically, events buffer in memory
4. **Nuclear rollback**: Redeploy previous billing service version (< 5 minutes)

## Post-Deploy Validation
- Confirm rate limiting returns correct 429 responses with Retry-After header
- Confirm audit logs appearing in PostgreSQL within 5 seconds of API calls
- Confirm no latency regression (p99 should stay under 50ms)
- Confirm circuit breaker test: kill Redis connection, verify graceful degradation

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Redis outage affects audit logging | Low | Medium | Circuit breaker + memory buffer |
| Rate limiter adds latency | Low | Medium | Benchmarked at <5ms per request |
| Connection pool exhaustion | Medium | High | Tuned pool sizes, circuit breaker (per postmortem mandate) |
| Feature flag misconfiguration | Low | High | Default OFF, gradual rollout |

**Overall risk: MEDIUM** — Proceed with canary deployment and staged rollout.
`,

    cto: `# CTO Decision

## Decision: APPROVED WITH CONDITIONS

## Score: 7/10

## Strengths
1. **Async audit logging pattern is correct** — The team learned from the notifications feature debacle and is not repeating the synchronous logging mistake. Good institutional learning.
2. **Circuit breaker included** — This addresses our mandatory requirement from the March 2025 postmortem. Non-negotiable, and it's here.
3. **Dual-layer rate limiting** — Both gateway and service-level, per our API design guide. This is how it should be done.
4. **Feature flag with canary rollout** — Proper deployment risk mitigation.

## Concerns
1. **Race condition in rate limiter** — QA found a real bug with in-memory state in multi-pod environments. This MUST be fixed with Redis-backed state before production.
2. **Audit buffer flush strategy** — Reviewer correctly flagged the missing backoff. Without jitter, we risk repeating the retry amplification from the payment outage.
3. **Test coverage gap** — The concurrent boundary test is failing. I want this green before merge.

## Conditions for Approval
1. Switch to Redis-backed rate limiter state (fixes QA race condition)
2. Add exponential backoff with jitter to audit buffer flush
3. Fix the failing concurrent boundary test
4. All reviewer comments addressed

## Lessons for the Organization
- The team is demonstrating institutional learning: async logging, circuit breakers, dual-layer rate limiting all came from past incidents. This is exactly how we improve.
- However, the race condition shows we need to be more careful about multi-instance behavior in design reviews.
- **New lesson**: Any in-memory state used for rate limiting or throttling must be evaluated for multi-instance correctness during architecture review.
`,
  };

  return responses[role];
}

export interface KnowledgeDoc {
  filename: string;
  content: string;
  metadata: Record<string, string>;
}

export const SEED_KNOWLEDGE: KnowledgeDoc[] = [
  {
    filename: "company-engineering-standards.md",
    metadata: { category: "standards", source: "engineering-handbook" },
    content: `# Acme Corp Engineering Standards

## Code Quality
- All PRs require 2 approvals before merge
- Minimum 80% test coverage for new code
- No direct commits to main; all changes go through feature branches
- Linting and type-checking must pass in CI

## Architecture Principles
- Prefer microservices for new domains; monolith for existing billing/auth
- PostgreSQL is the default datastore unless there's a strong reason otherwise
- All new services must expose health check endpoints
- Use structured JSON logging (no console.log in production)

## Deployment
- All services deploy via CI/CD pipeline
- Feature flags required for any user-facing change
- Canary deployment for services handling >1000 rps
- Rollback plan required in every release ticket

## API Standards
- REST with JSON response envelopes: { data, error, meta }
- Versioned endpoints: /api/v1/...
- Rate limiting on all public endpoints
- Authentication via JWT with short-lived tokens
`,
  },
  {
    filename: "postmortem-payment-outage-2025.md",
    metadata: { category: "postmortem", source: "incident-db", severity: "P1" },
    content: `# Postmortem: Payment Processing Outage — March 2025

## Incident Summary
Duration: 47 minutes of degraded payment processing
Impact: ~2,300 failed transactions, estimated $180K in delayed revenue
Severity: P1

## Root Cause
The billing service exhausted its database connection pool during a traffic spike caused by a marketing campaign. The service had no circuit breaker, so failed connections continued to pile up, creating a cascading failure that spread to the invoice and notification services.

## Timeline
- 14:02 — Traffic spike begins (3x normal)
- 14:08 — Connection pool saturated, first 5xx errors
- 14:15 — Cascading failures reach invoice service
- 14:22 — On-call paged, begins investigation
- 14:35 — Manual restart of billing service pods
- 14:49 — Service fully recovered

## What Went Wrong
1. No circuit breaker on the billing service database connections
2. Connection pool size was set to default (10) instead of tuned for load
3. No rate limiting between internal services
4. Alerting threshold was too high — triggered 13 minutes after first errors
5. Retry logic in the invoice service used fixed intervals with no jitter, amplifying traffic

## Lessons Learned
- **CRITICAL**: All services handling financial transactions MUST have circuit breakers
- Connection pool sizes must be load-tested and tuned, not left at defaults
- Internal service-to-service calls need rate limiting and backpressure
- Retry logic MUST include exponential backoff with jitter
- Alert thresholds should trigger within 2 minutes of error rate increase

## Action Items
- [ ] Add circuit breakers to billing, invoice, and notification services
- [ ] Tune connection pool sizes based on load test results
- [ ] Implement internal rate limiting on service mesh
- [ ] Add jitter to all retry logic
- [ ] Lower alerting thresholds to 1% error rate over 2 minutes
`,
  },
  {
    filename: "api-design-guide.md",
    metadata: { category: "guide", source: "platform-team" },
    content: `# API Design Guide — Acme Corp

## Response Envelope
All API responses follow this structure:
\`\`\`json
{
  "data": {},
  "error": null,
  "meta": { "request_id": "...", "timestamp": "..." }
}
\`\`\`

## Error Handling
- Use standard HTTP status codes
- Include machine-readable error codes: \`RATE_LIMIT_EXCEEDED\`, \`INVALID_INPUT\`, etc.
- Never expose internal stack traces in production responses
- Log full error context server-side with correlation IDs

## Versioning
- URL-based versioning: /api/v1/, /api/v2/
- Breaking changes require a new version
- Deprecated versions get 6-month sunset period with headers

## Rate Limiting
- Apply at the API gateway level AND per-service level
- Use token bucket algorithm
- Return 429 with Retry-After header
- Rate limit by API key, not by IP alone
- IMPORTANT: Rate limiting at only the controller layer is insufficient — must also apply at the service/middleware layer for consistency

## Authentication
- JWT tokens with 15-minute expiry
- Refresh tokens stored server-side
- API keys for service-to-service communication
- Never log or expose tokens in URLs or query parameters
`,
  },
  {
    filename: "previous-feature-user-notifications.md",
    metadata: { category: "feature-history", source: "project-archive" },
    content: `# Feature Case Study: Real-Time User Notifications

## Overview
Implemented WebSocket-based notification system for the billing dashboard. Users receive real-time updates on payment status, invoice generation, and account alerts.

## Architecture
- WebSocket server using Socket.IO
- Redis pub/sub for cross-instance message delivery
- PostgreSQL for notification persistence and read-status tracking
- Feature flag: \`notifications.realtime.enabled\`

## What Went Well
- WebSocket reconnection logic was solid — 99.7% delivery rate
- Feature flag allowed gradual rollout (5% → 25% → 100%)
- Redis pub/sub handled the scale without issues

## Issues Found During Development
1. **Synchronous notification writes blocked the main request**: Initially, sending notifications was synchronous in the payment processing flow, adding 200ms latency. Had to move to async queue.
2. **Feature flag default was "on"**: QA caught that the default was unsafe — new users got the feature before it was ready. Changed default to "off" with explicit opt-in.
3. **Missing edge case**: Notifications for deleted accounts caused null pointer exceptions. Reviewer warned about this but it was deprioritized and hit production.

## Outcome
Shipped successfully after 2 iterations. The async pattern and feature flag lessons became team standards.
`,
  },
  {
    filename: "team-retro-q1-2025.md",
    metadata: { category: "retro", source: "team-retros" },
    content: `# Q1 2025 Retrospective — Platform Team

## Wins
- Reduced average deploy time from 22 minutes to 8 minutes
- Zero P1 incidents in January (first month ever)
- Successfully migrated billing service to new database cluster with no downtime

## Problems
- Test flakiness increased — 3 different CI runs required for green builds
- Documentation got stale — 40% of runbooks were outdated
- Code review turnaround averaged 2 days — too slow for sprint velocity
- Audit logging was added synchronously in two services, causing latency regressions

## Action Items
- Implement contract testing to reduce flakiness from integration test dependencies
- Add auto-generated architecture diagrams from code annotations
- Set 24-hour SLA for code review responses
- **All new logging and audit trails MUST be asynchronous** — use event queues, not synchronous writes in the request path

## Team Agreements
- No synchronous logging in request-critical paths
- Every new service must have a runbook before going to production
- Feature flags must default to OFF for new features
`,
  },
];

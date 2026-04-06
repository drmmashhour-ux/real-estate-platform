# Agents

All agents share the lifecycle contract in `lib/ai/agents/agent-runtime.ts`: `observe`, `diagnose`, `plan`, `proposeActions`, `executeAllowedActions`, `summarizeOutcome`.

| Agent key | Focus |
|-----------|--------|
| `guest_support` | Booking Q&A, policies, escalation hints |
| `host_management` | Payout readiness, host nudges |
| `listing_optimization` | Copy, completeness, SEO-style hints |
| `booking_ops` | Stalled bookings, operational follow-ups |
| `revenue` | Promotions, pricing **suggestions** (not silent live changes) |
| `trust_safety` | Disputes, flags, admin queue |
| `admin_insights` | Operational digests from real queries |
| `compliance` | Disclaimers, non-legal framing |
| `growth` | Growth recommendations tied to real events |
| `communications` | Template-gated messages via `communications-engine` |

Routing: `lib/ai/routing/agent-router.ts` + optional explicit `agentKey` from client.

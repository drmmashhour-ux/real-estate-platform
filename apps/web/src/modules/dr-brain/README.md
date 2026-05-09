# DrBrain

## Purpose

Admin intelligence — system health dashboards, analytics, fraud and risk detection, AI-powered recommendations, and trust graph management. DrBrain gives platform operators the visibility and tools to keep the ecosystem safe and performant.

## Owned Routes

| Route | Description |
|---|---|
| `/admin` | Admin dashboard home |
| `/admin/dr-brain` | AI-powered admin insights |
| `/admin/trustgraph` | Trust graph visualization & management |
| `/admin/monitoring` | System health & uptime monitoring |
| `/owner` | Property owner admin view |
| `/broker` | Broker admin view |

## Owned Data Models

| Model | Description |
|---|---|
| `AdminAuditLog` | Admin-specific audit trail |
| `SystemValidation` | Automated system health check records |
| `FraudAlert` | Flagged fraudulent or suspicious activity |
| `TrustScore` | Computed trust score for users and entities |

## Dependencies

- **Core** — authentication and role-based access control
- **All other modules** — observability hooks and data aggregation

## What Does NOT Belong Here

- Public-facing pages or user-facing UI (→ respective module)
- User-facing booking or property search (→ **BNHub** / **Homes**)
- Payment processing or payout logic (→ **BNHub** via Stripe)

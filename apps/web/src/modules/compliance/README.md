# Compliance

## Purpose

Shared OACIQ/legal guardrail layer — compliance rules engine, publish gates, and audit trail. Compliance acts as middleware that other modules call into before allowing regulated actions (e.g., publishing a listing, verifying a host, executing a contract).

## Owned Routes

| Route | Description |
|---|---|
| `/compliance` | Admin-facing compliance dashboard |
| *(middleware)* | Integrated as validation middleware into Homes, Forms, and BNHub |

## Owned Data Models

| Model | Description |
|---|---|
| `ComplianceAudit` | Immutable record of compliance checks performed |
| `ComplianceRule` | Configurable compliance rule definition |
| `RiskSeverity` | Risk classification levels for compliance violations |

## Dependencies

- **Core** — authentication and user identity
- **Prisma** — database access layer

## What Does NOT Belong Here

- UI pages for property search, listings, or forms (→ **Homes** / **Forms**)
- Payment logic, Stripe integration, or payout flows (→ **BNHub** via Stripe)

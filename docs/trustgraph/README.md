# TrustGraph Autopilot — documentation index

TrustGraph is the **rules-first** trust, readiness, and execution layer for LECIPM. Implementation lives in **`apps/web`** (`lib/trustgraph/`, Prisma models, Next.js routes), not under `src/modules/` (path alias `@/lib/trustgraph/*`).

| Document | Purpose |
|----------|---------|
| [TRUSTGRAPH_ROADMAP.md](./TRUSTGRAPH_ROADMAP.md) | Product position, Phase 1–3 scope, 4-sprint rollout, monetization matrix, success metrics, feature flags |
| [TRUSTGRAPH_RULE_MATRIX.md](./TRUSTGRAPH_RULE_MATRIX.md) | Rule codes, pipeline order, signal ↔ next-best-action mapping |
| [TRUSTGRAPH_ENTITY_FLOW.md](./TRUSTGRAPH_ENTITY_FLOW.md) | Data flows: listing, declaration, broker, admin, audit |
| [TRUSTGRAPH_ADMIN_REVIEW_GUIDE.md](./TRUSTGRAPH_ADMIN_REVIEW_GUIDE.md) | Admin queue, case detail, overrides, RLS / exposure notes |
| [TRUSTGRAPH_MANUAL_QA.md](./TRUSTGRAPH_MANUAL_QA.md) | Manual QA checklist |
| [TRUSTGRAPH_IMPLEMENTATION_REPORT.md](./TRUSTGRAPH_IMPLEMENTATION_REPORT.md) | Code paths, APIs, migrations, tests (living reference) |

**Config entry points:** `apps/web/config/trustgraph.ts`, `apps/web/config/uploads.ts` (re-export canonical `lib/trustgraph` config).

**Database:** Prisma models in `apps/web/prisma/schema.prisma` (TrustGraph section). Migration: `prisma/migrations/20260424160000_trustgraph_phase1/` (and follow-ups for indexes such as `score_breakdown` if applicable).

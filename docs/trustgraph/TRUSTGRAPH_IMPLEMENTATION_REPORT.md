# TrustGraph — implementation report (living)

**Last aligned with:** `apps/web` monolith. This is a **reference** for what exists in tree; it is not a substitute for `git log`.

## Roadmap docs (this folder)

| File | Role |
|------|------|
| `README.md` | Index + code paths |
| `TRUSTGRAPH_ROADMAP.md` | Phases 1–3, 4 sprints, flags, monetization, metrics |
| `TRUSTGRAPH_RULE_MATRIX.md` | Rule IDs ↔ `rule_code`, flags |
| `TRUSTGRAPH_ENTITY_FLOW.md` | Listing, case lifecycle, broker, audit |
| `TRUSTGRAPH_ADMIN_REVIEW_GUIDE.md` | Admin UX and API |
| `TRUSTGRAPH_MANUAL_QA.md` | QA + commands |

## Code layout (`apps/web`)

| Area | Path |
|------|------|
| Domain | `lib/trustgraph/domain/` (types, scoring, contracts, rules.ts) |
| Application | `lib/trustgraph/application/` (create case, pipeline, human review) |
| Infrastructure | `lib/trustgraph/infrastructure/` (repositories, rules, services, audit) |
| Integration | `lib/trustgraph/integration/fsboListing.ts` |
| Feature flags | `lib/trustgraph/feature-flags.ts`, `config/trustgraph.ts` |
| Uploads | `lib/trustgraph/upload-validation-config.ts`, `config/uploads.ts` |
| API routes | `app/api/trustgraph/**` |
| Admin UI | `app/admin/trustgraph/**` |
| Widgets | `components/trust/*`, `components/legal/SellerDeclarationReadiness.tsx`, `components/brokers/BrokerVerificationBadge.tsx` |
| Nav | `lib/hub/navigation.ts` → TrustGraph |
| Seed | `prisma/seed-trustgraph-demo.ts`, script `npm run seed:trustgraph` |
| Tests | `lib/trustgraph/**/*.test.ts`, `npm run test -- --run lib/trustgraph` |

## Prisma / SQL

- Models and enums: `prisma/schema.prisma` (TrustGraph section).
- Migration directory includes: `prisma/migrations/20260424160000_trustgraph_phase1/` (and later deltas for `score_breakdown` / indexes as applied in your branch).

## APIs (summary)

- `POST /api/trustgraph/cases`
- `GET /api/trustgraph/cases/[id]`
- `POST /api/trustgraph/cases/[id]/run`
- `POST /api/trustgraph/cases/[id]/actions`
- `GET /api/trustgraph/queue`
- `GET /api/trustgraph/trust-profile/[subjectType]/[subjectId]`
- `GET /api/trustgraph/listings/[listingId]/status`

## Feature flags (env)

- `TRUSTGRAPH_ENABLED` — master.
- `TRUSTGRAPH_ADMIN_QUEUE_ENABLED`, `TRUSTGRAPH_LISTING_BADGE_ENABLED`, `TRUSTGRAPH_BROKER_BADGE_ENABLED`, `TRUSTGRAPH_DECLARATION_WIDGET_ENABLED` — sub-features; **default on** when master is on unless explicitly false.

See `apps/web/.env.example` TrustGraph section.

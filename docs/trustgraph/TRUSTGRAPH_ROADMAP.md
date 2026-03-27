# TrustGraph (LECIPM) — phased roadmap

TrustGraph Autopilot is the **core intelligence layer** between listings, users, brokers, legal documents, uploads, bookings, and admin review. It answers, in product terms:

- Is this entity trustworthy?
- Is this transaction ready?
- What is missing?
- What should happen next?
- Can this be auto-approved, or should it go to admin/legal review?

**Deterministic rules** are the source of truth; optional AI summarization is secondary and never the sole approver. See `lib/trustgraph/infrastructure/services/caseSummaryService.ts`.

---

## Principles

- **Deterministic execution** — scores and pass/fail come from versioned rules (`TRUSTGRAPH_RULE_VERSION` in `lib/trustgraph/config.ts`).
- **Feature flags** — ship dark; enable per surface (`TRUSTGRAPH_*` env vars). See **Flag matrix** below.
- **Zero regression** — integrations are no-ops when `TRUSTGRAPH_ENABLED` is unset/false.
- **Auditability** — `HumanReviewAction`, `VerificationRuleResult`, platform events (`lib/trustgraph/infrastructure/trustgraphAudit.ts`).

---

## Product phases (market rollout)

### Phase 1 — Highest-impact market control (current implementation focus)

- Listing trust score (FSBO listing pipeline)
- Seller declaration readiness (completeness + contradictions via rules)
- Broker verification signals (license presence, profile minimums; badge UX)
- Admin TrustGraph queue + case detail
- Listing trust badge, declaration widget, broker chip (each flag-gated)
- Upload/media validation alignment (`config/uploads.ts`, FSBO photo limits)
- Next best actions + manual override + audit trail

**Why first:** fake or weak listings, address/type mismatches, incomplete declarations, weak broker profiles, bad media, and no central admin queue are the most expensive product risks.

### Phase 2 — Cross-hub domination

- BNHub: host/guest/booking risk scoring; short-term listing verification hooks
- Rental application readiness
- Mortgage file readiness
- Buyer/offer readiness (scaffolding)
- Cross-entity links (`entity_verification_links`) for richer graphs

**Prerequisite:** Phase 1 stable; same engine, new entity types and rule packs.

### Phase 3 — Offer-to-close copilot & monetization

- Offer-to-close transaction copilot
- Auto-generated legal checklist (driven by rule outputs)
- Market exposure / verified listing boost tied to trust score
- Verified Listing Boost, Broker Verified Pro, BNHub host shield, brokerage compliance subscriptions, investor “verified opportunity” filter

**Prerequisite:** Phase 2 metrics and admin workflows proven.

---

## Four-sprint engineering rollout (build order)

### Sprint 1 — Foundation

- Prisma models: `verification_cases`, `verification_signals`, `verification_rule_results`, `trust_profiles`, `human_review_actions`, `next_best_actions`, `media_verification_jobs`, `entity_verification_links`
- Domain enums/types/contracts (`lib/trustgraph/domain/*`), scoring (`domain/scoring.ts`), `RuleEvaluationResult` contract
- Repositories (`infrastructure/repositories/*`)
- Vitest scaffolding (`domain/scoring.test.ts`, rule tests)

### Sprint 2 — Rules & pipeline

- FSBO listing rules: address, listing type, media, seller declaration, duplicate media, suspicious pricing (`infrastructure/rules/*`, `verificationPipeline.ts`)
- Stub rules for broker/booking/mortgage/rental for future entities
- Next-best action generation from rule outputs; deterministic summary fallback (`caseSummaryService.ts`)

### Sprint 3 — Surfaces

- APIs: `POST/GET /api/trustgraph/cases`, `POST .../run`, `GET .../queue`, `POST .../actions`, trust profile, listing status — Zod validation, admin/owner guards
- Admin: `/admin/trustgraph`, `/admin/trustgraph/cases/[id]`
- UI: `ListingTrustBadge`, `ListingTrustGraphPanel`, `SellerDeclarationReadiness`, `BrokerVerificationBadge`, `TrustGraphCaseActions`

### Sprint 4 — Integration & hardening

- FSBO hub PATCH: `syncTrustGraphForFsboListing` (`lib/trustgraph/integration/fsboListing.ts`)
- Publish / submit paths: non-blocking sync after gates
- Seed: `npm run seed:trustgraph` (`prisma/seed-trustgraph-demo.ts`)
- Audit logging, tests, manual QA (`TRUSTGRAPH_MANUAL_QA.md`)

---

## Feature flag matrix

| Env var | Purpose |
|---------|---------|
| `TRUSTGRAPH_ENABLED` | **Master switch** — engine, DB writes from integrations, core APIs. |
| `TRUSTGRAPH_ADMIN_QUEUE_ENABLED` | Admin nav link, queue UI, `GET /api/trustgraph/queue`. |
| `TRUSTGRAPH_LISTING_BADGE_ENABLED` | Seller UI: listing trust panel / badge. |
| `TRUSTGRAPH_BROKER_BADGE_ENABLED` | Broker surfaces: verification chip. |
| `TRUSTGRAPH_DECLARATION_WIDGET_ENABLED` | Seller UI: declaration readiness widget. |

**Default behavior:** when `TRUSTGRAPH_ENABLED=true`, sub-feature env vars **default to ON** unless explicitly set to `false`/`0`/`off`. Implementation: `lib/trustgraph/feature-flags.ts`.

Rule **logic** does not change with UI flags; flags only hide or show integrations and components.

---

## Monetization matrix (Phase 3 alignment)

| Tier | TrustGraph tie-in |
|------|-------------------|
| **Free** | Basic checks; strict photo limits; readiness warnings; no verified badge |
| **Pro seller / broker** | Badge eligibility, expanded uploads, trust recommendations, faster review queue (product policy) |
| **Brokerage** | Team compliance dashboard, trust analytics, bulk review (future) |
| **BNHub host premium** | Guest risk shield, host score, quality boost (Phase 2+) |
| **Investor premium** | Verified opportunity filter, confidence layer (Phase 3) |

---

## Success metrics (track from Phase 1)

**Trust / quality:** % listings high/verified trust; % blocked on critical signals; % missing exterior; % incomplete declarations.

**Operations:** median time in queue; override rate; signal dismiss rate (quality of rules).

**Business:** publish-to-contact conversion; uplift on verified listings; premium conversion from trust prompts.

---

## Operations

- **Migrations:** `cd apps/web && npx prisma migrate deploy` (or `migrate dev` locally). TrustGraph migration folder: `20260424160000_trustgraph_phase1` (plus any later deltas).
- **Generate:** `npx prisma generate`
- **Tests:** `npm run test -- --run lib/trustgraph`
- **Dev:** `TRUSTGRAPH_ENABLED=true npm run dev`

## Manual QA

See [TRUSTGRAPH_MANUAL_QA.md](./TRUSTGRAPH_MANUAL_QA.md).

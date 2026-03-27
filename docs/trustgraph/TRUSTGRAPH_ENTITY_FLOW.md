# TrustGraph — entity flows

Implementation paths use **`apps/web`** and `@/lib/trustgraph/*`.

---

## FSBO listing (primary) — entity `LISTING`

`entity_id` is the **FSBO listing id** (`fsbo_listings.id`).

1. **Draft / edit** — `PATCH /api/fsbo/listings/[id]/hub` persists listing + declaration. When `TRUSTGRAPH_ENABLED=true`, `syncTrustGraphForFsboListing` runs (`lib/trustgraph/integration/fsboListing.ts`), typically non-blocking on failure.
2. **Submit for verification** — after validation, sync ensures the latest declaration/docs are scored before status moves to `PENDING_VERIFICATION`.
3. **Publish** — after `assertSellerHubSubmitReady` and checkout path, sync aligns trust state with what buyers may see.
4. **Read path** — `GET /api/trustgraph/listings/[listingId]/status` returns the latest `VerificationCase` (+ optional `TrustProfile`) for authorized users.

---

## Verification case lifecycle

1. **Create or reuse** — `getLatestCaseForEntity(LISTING, listingId)` → `createVerificationCase` if missing.
2. **Run pipeline** — `runVerificationPipelineForCase` → `runFsboListingVerificationPipeline` writes:
   - `VerificationRuleResult` rows (replace set for case)
   - `VerificationSignal` rows
   - `NextBestAction` rows
   - Case `overallScore`, `trustLevel`, `readinessLevel`, `summary`, `explanation`, optional `scoreBreakdown`
3. **Human review** — admins POST `HumanReviewAction` via `/api/trustgraph/cases/[id]/actions`; case `status` / `assignedTo` / `resolvedAt` update; **append-only** review log (Prisma relation: `reviewActions`, not `humanActions`).

---

## Seller declaration

- Completeness and contradiction signals are produced inside **`seller_declaration_completeness`** rule output.
- **UI:** `SellerDeclarationReadiness` when `TRUSTGRAPH_DECLARATION_WIDGET_ENABLED` is on (and master flag).

---

## Broker

- `BrokerVerification` / user profile fields feed **`broker_license_presence`** when a broker-scoped pipeline runs.
- **UI:** `BrokerVerificationBadge` when `TRUSTGRAPH_BROKER_BADGE_ENABLED` is on.

---

## Trust profile

- Optional denormalized **`TrustProfile`** for fast UI; **`VerificationCase`** remains authoritative for a given run.

---

## Audit & observability

- Pipeline runs and human reviews should emit structured events (see `lib/trustgraph/infrastructure/trustgraphAudit.ts` and `recordPlatformEvent` usage in `applyHumanReviewAction` / pipeline).
- **Do not** expose raw `verification_signals` to public clients; use sanitized listing status API or badges.

---

## Supabase / RLS note

TrustGraph tables are **internal**. The browser should only receive **sanitized** snapshots via Next.js route handlers. If you enable RLS on Postgres, restrict `verification_*` tables to service role / admin contexts; never map anon keys to full fraud data.

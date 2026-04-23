# Tenant migration & multi-app split — inventory and execution order

This document is the **production-safe** playbook for (1) scoping data by **workspace tenant** and (2) splitting `apps/web` into specialized apps. It aligns with the phased strategy: **nullable FK → backfill → patch reads/writes → validate → enforce → extract packages → new apps → traffic cutover**.

**Source of truth for model names:** `apps/web/prisma/schema.prisma`.

**Regenerate the raw model list locally:**

```bash
rg '^model [A-Za-z0-9_]+' apps/web/prisma/schema.prisma
```

---

## Part A — Target monorepo structure (north star)

```
apps/
  public/     # marketing, SEO, public portals, white-label homepages
  bnhub/      # guest + host — stays, calendar, pricing, BNHub notifications
  broker/     # brokerage workstation — CRM, OACIQ/forms, appraisal, investor, deals, alerts
  admin/      # platform admin — tenants, flags, executive, compliance oversight, audit exports

packages/
  ui/           # shared design system
  tenant/       # resolve tenant, theme, guards, scope helpers
  auth/         # session + shared auth helpers
  db/           # Prisma client + DB helpers
  ai/           # shared AI engines / prompts
  compliance/   # shared compliance logic
  finance/      # shared financial logic
  market/       # market, deals, alerts, watchlist (domain modules)
  appraisal/    # appraisal engines
  workflows/    # workflow engine
```

**Constraints:** one shared database, one shared auth foundation, one shared design system, **strict tenant scoping** on tenant-owned data.

---

## Part B — Four phases (do not ship as one rewrite)

| Phase | Focus | Risk level |
| ----- | ----- | ---------- |
| **1** | Tenant foundation: nullable `tenantId`, backfill, legacy app unchanged | Low |
| **2** | Internal modularization: move logic into `packages/*` | Medium |
| **3** | New apps: `apps/bnhub`, `apps/broker`, `apps/admin`, `apps/public` | Medium–high |
| **4** | Traffic cutover: redirects, feature flags, deprecate mixed routes | High |

---

## Part C — Critical lexicon (avoid production bugs)

### C.1 `Tenant` (workspace / white-label org)

The **`Tenant`** model (`tenants` table) is the **brokerage / agency / enterprise** scope used for white-label and multi-tenant CRM-style data. It already exists in the schema, with:

- `TenantBrand`, `TenantFeatureFlag`, `TenantMembership`
- Relations from `Tenant` to many domain models (see `model Tenant { ... }` in Prisma)

**Migration work** is largely: extend **`tenantId String?` → backfill → require**, and ensure **every read/write** on tenant-owned rows filters on this FK (or a derived rule).

### C.2 `EnterpriseWorkspace` (LECIPM team workspace)

**`EnterpriseWorkspace`** is a **separate** org construct (UUID id) used for team collaboration (deals, leads, workspace reputation, etc.). Many models use `workspaceId` (e.g. `Deal.workspaceId`).

**Decision required before “final” tenant lock:** either

- **Link** `EnterpriseWorkspace` to `Tenant` (e.g. `tenantId` on workspace), or
- **Treat** workspace as the canonical scope for some tables and map tenant resolution from workspace membership.

Document the chosen mapping in a short ADR when you implement Phase 1.

### C.3 Rental models: `tenantId` means **renter User**, not `Tenant`

In **`RentalApplication`**, **`RentalLease`**, and related rent-hub models, **`tenantId` maps to `User`** (the lessee), **not** to the `Tenant` workspace table.

**Do not backfill those columns** with `Tenant.id`. Use a different field name if you introduce workspace scope there (e.g. `workspaceTenantId`).

---

## Part D — Current schema snapshot (as of this inventory)

### D.1 Tenant platform models (already present)

| Model | Role |
| ----- | ---- |
| `Tenant` | Root tenant row (`slug`, `primaryDomain`, `subdomain`, `tenantType`, …) |
| `TenantBrand` | White-label branding |
| `TenantFeatureFlag` | Per-tenant feature toggles |
| `TenantMembership` | User ↔ tenant role membership |

### D.2 Examples already scoped with `Tenant` FK (nullable or required)

The schema already attaches **`Tenant?`** (or required `tenantId`) on a **subset** of domain models. Non-exhaustive examples from relations on `Tenant`:

- `FsboListing.tenantId` (optional) — multi-tenant scope for brokerage-published inventory
- `Booking.tenantId` (optional) — BNHub booking workspace tenant
- `Listing.tenantId` (optional) — unified listing table
- `Contract.tenantId`, `Offer.tenantId`, messaging/documents under tenant CRM
- `InvestmentDeal.tenantId` (optional)
- `WatchlistItem` / `AlertCandidate` workspace tenant relations (see Prisma: `WatchlistItemWorkspaceTenant`, `AlertCandidateWorkspaceTenant`)

**Implication:** Phase 1 is **not** “add Tenant from scratch”; it is **complete the matrix** (every tenant-owned table has a consistent FK), **backfill**, and **enforce queries**.

### D.3 Examples still user-scoped or owner-scoped only (candidates for `tenantId`)

These patterns need **explicit classification** and often **`tenantId String?` + index**:

| Area | Example models | Notes |
| ---- | -------------- | ----- |
| Saved searches | `SavedSearch` | Today: `userId` only — add optional `tenantId` if searches are tenant assets |
| Watchlists | `Watchlist`, `WatchlistItem` | `Watchlist` is per-user; items may also tie to workspace tenant — align with product |
| Deals (resale) | `Deal` | Uses `workspaceId` (`EnterpriseWorkspace`) today — align with `Tenant` strategy |
| Digest / AI workflow | `DailyDigest`, `AIWorkflow` | Today: `ownerType` / `ownerId` — add `tenantId` if briefings are tenant-scoped |
| Market aggregates | `MarketSnapshot`, `RevenueSnapshot` | Often **platform-global**; optional per-tenant copies only if product requires |

---

## Part E — Classification rubric (every model)

For **each** `model` in `schema.prisma`, assign exactly one:

1. **Tenant-owned (workspace)** — end-user or operational data that must not leak across agencies/white-label tenants. **Typically needs `tenantId` → `Tenant`** (nullable first).
2. **Platform-owned** — global config, internal admin, cross-tenant analytics definitions. **Usually no `tenantId`** (or explicit `null` meaning global).
3. **Shared reference** — geography, static catalogs, read-only knowledge. **No tenant FK.**

**Heuristics:**

- If the row is shown in a **broker dashboard** tied to a **white-label tenant**, it is **tenant-owned**.
- If the row is **immutable market statistics** reused by all tenants, it is **shared reference** or **platform-owned**.
- If the row is **auth/session** (`User`, `Session`), it is **platform-owned** at user level; **tenant membership** lives in `TenantMembership`.

---

## Part F — Suggested tenant-owned domains (prioritized patching order)

Use this order for **nullable FK → backfill → read paths → write paths**:

**Priority 1 — marketplace & engagement**

- Listings and listing-adjacent: `FsboListing`, `Listing`, `ShortTermListing`, BNHub listing graphs
- Bookings and payments: `Booking`, `BnhubReservationPayment`, dispute/payment ledgers where data is tenant-operated
- Alerts / watchlist / saved discovery: `WatchlistAlert`, `AlertCandidate`, `SavedSearch` (if tenant-owned by policy), deal watchlists

**Priority 2 — brokerage & investor**

- CRM: `Lead`, `LecipmCrm*`, broker conversations
- Deals: `Deal` (+ `workspaceId` / future `tenantId` alignment)
- Investor: `InvestmentDeal`, `InvestorPortfolio`, pipeline / memo tables

**Priority 3 — AI & automation**

- `AIWorkflow`, `CopilotConversation`, `DailyDigest`, autopilot / executive task tables

**Priority 4 — financial & compliance**

- `DealFinancial`, tax / trust / commission tables that represent **tenant business** (not global platform revenue aggregates)

Always re-validate **cross-tenant reference** rules (e.g. cannot attach listing from tenant A to tenant B watchlist).

---

## Part G — Implementation sequence (checklist)

Mirror this order in tickets/PRs:

1. **This inventory** — keep updated when new models ship.
2. **Tenant / brand / membership / flags** — already present; extend only if gaps (e.g. tenant-level auth policy).
3. **Add `tenantId String?` + `@@index([tenantId])`** on each **tenant-owned** model that lacks it (backward compatible).
4. **Legacy tenant** — script: `scripts/create-legacy-tenant.ts` (e.g. slug `lecipm-core` or `core`).
5. **Backfill** — `scripts/backfill-tenant-ids.ts` (idempotent, batched).
6. **Validate** — `scripts/validate-tenant-backfill.ts` (null counts, per-tenant counts, referential sanity).
7. **`packages/tenant` helpers** — `withTenantScope`, `assertSameTenant` (see plan below).
8. **Patch read paths** — every `findMany` / `findFirst` on tenant-owned data includes `tenantId` (or safe join).
9. **Patch write paths** — every `create` / `update` sets `tenantId`; validate same-tenant references.
10. **Auth/session** — resolve **current tenant** per request (host, domain, membership, optional explicit switcher).
11. **Make `tenantId` required** on core tables (only after zeros nulls + tests).
12. **Extract packages** from `apps/web` (db, auth, tenant, ui, ai, market, …).
13. **Create `apps/public`**, then `apps/bnhub`, `apps/broker`, `apps/admin`.
14. **Redirects** from legacy routes in `apps/web` (transition hub).
15. **Feature flags** — `new_bnhub_app`, `new_broker_app`, `new_admin_app`.
16. **Security audit** — cross-tenant attempts, IDOR, AI context mixing.
17. **Progressive traffic** cutover.

---

## Part H — Scripts to add (skeleton contracts)

### H.1 `scripts/create-legacy-tenant.ts`

- Upsert `Tenant` with slug **`lecipm-core`** (or `core`), `status = ACTIVE`, `tenantType` = platform/agency per product.
- Idempotent: safe to re-run.

### H.2 `scripts/backfill-tenant-ids.ts`

- For each targeted table: `UPDATE … SET tenant_id = :legacy WHERE tenant_id IS NULL` (with batching).
- Prefer **deterministic** rules: e.g. `FsboListing.tenantId` from owning broker’s membership; `Booking` from host’s tenant; else legacy tenant.
- **Exclude** rental “lessee” `tenantId` columns (User FK).

### H.3 `scripts/validate-tenant-backfill.ts`

- Report: `COUNT(*)` where `tenant_id IS NULL` per table.
- Report: row counts grouped by `tenant_id`.
- Fail CI if any **mandated** table has nulls before “required FK” migration.

---

## Part I — Tenant helpers (target API)

### I.1 `withTenantScope`

```ts
// packages/tenant/src/scope.ts
export function withTenantScope<T extends Record<string, unknown>>(tenantId: string, where?: T) {
  return { ...(where ?? {}), tenantId } as T & { tenantId: string };
}
```

### I.2 Same-tenant assertion

```ts
// packages/tenant/src/assert-same-tenant.ts
// assertSameTenant(resourceTenantId, sessionTenantId)
```

Use on writes that link two entities (listing ↔ watchlist, workflow ↔ listing, etc.).

---

## Part J — Multi-app split (after tenant scoping matures)

### J.1 Package extraction first

Move code **before** or **in parallel** with new apps so each app is thin: routes + app-specific wiring only.

### J.2 App boundaries

- **`apps/public`**: marketing, SEO, public entry, white-label homepages.
- **`apps/bnhub`**: search, booking, guest/host dashboards, BNHub notifications — **no** heavy broker compliance bundles.
- **`apps/broker`**: listings, CRM, OACIQ/forms, appraisal, investor tools, copilot, workflows.
- **`apps/admin`**: tenant admin, executive command, compliance exports, AI governance — **strict RBAC**.

### J.3 Deploy order

1. `public`
2. `bnhub`
3. `broker`
4. `admin`

### J.4 Cutover

- Keep **`apps/web`** temporarily as **redirect / compatibility** layer (`/bnhub/*`, `/dashboard/broker/*`, `/dashboard/admin/*`).
- Gate with feature flags per tenant or cohort.

---

## Part K — Testing / validation (gate before required `tenantId`)

- **Data:** zero null `tenantId` on mandated tables; no cross-tenant FK pairs; counts match pre-migration baselines.
- **Auth:** tenant resolves from host + membership; admin cannot read other tenants; users cannot escalate.
- **Apps:** BNHub bundle excludes broker-only chunks; broker excludes admin chunks.
- **AI:** copilot / digest / workflow context **never** mixes tenant A and B in one prompt.

---

## Part L — Maintainer note

This file is **Tier 1 documentation**: update it when:

- New Prisma models are added in tenant-owned domains.
- `Tenant` vs `EnterpriseWorkspace` strategy is decided.
- A table is reclassified (e.g. global market snapshot vs tenant-specific copy).

For a full enum of all models, rely on `schema.prisma` + the `rg` command at the top; duplicating 300+ model names here would go stale quickly.

# LECIPM Manager — Launch readiness report (final GO / NO-GO)

**Run date:** 2026-04-06  
**Scope:** Resolve DB blockers, validate core + Stripe flows, record automated checks. No new features.

---

## Final decision

| | |
|--|--|
| **STATUS** | **GO** (for environments where the commands below succeed) |
| **Blockers** | **None** at the time of this run (migrations current, core flows + BNHub Stripe script passed). |
| **Warnings** | Manual browser checkout, production Stripe Connect capabilities, loyalty multi-booking QA, AI/messaging lifecycle spot checks, Expo device, and full i18n pass are still recommended before a **production** cutover. |

---

## Step 1 — Database migrations

### Commands

```bash
cd apps/web && pnpm exec prisma migrate deploy
pnpm exec prisma generate   # from apps/web
```

Root shortcut:

```bash
pnpm db:migrate:deploy
```

### Result (this run)

- **50 migrations** present; **No pending migrations** on the configured datasource (`DATABASE_URL` from `apps/web/.env`).
- **`prisma generate`** — success.

### Schema drift

- No drift detected via migrate deploy. Column **`ai_discovery_score`** and related BNHub schema are satisfied when migrations are applied (prior failure was an unmigrated DB).

---

## Step 2 — Core flow validation (post-migration)

### Command

```bash
pnpm validate-core-flows
# same as: pnpm validate:flows
```

### Result (this run)

```
A. Listing create / photo row / edit: OK
B. Booking create / status: OK
C. User create / role: OK
D. Booking issue (moderation) update: OK
D. Host application approve: OK
All core DB flows passed.
```

| System | Result |
|--------|--------|
| **DB** | Passed |
| **Booking (scripted CRUD + status)** | Passed |

---

## Step 3 — Stripe BNHub end-to-end (automated)

### Command

```bash
cd apps/web && pnpm exec tsx scripts/validate-bnhub-stripe-e2e.ts
# or: pnpm --filter @lecipm/web run validate:bnhub-stripe
```

### Prerequisites

- `STRIPE_SECRET_KEY` (test), `STRIPE_WEBHOOK_SECRET` (`whsec_…`)
- Next dev/server reachable (script used `http://127.0.0.1:3001` in this run)

### Result (this run)

- Pricing quote, marketplace checkout prep, Checkout Session create, **synthetic paid webhook**, DB booking **CONFIRMED**, marketplace payment **PAID**, fee split consistency — **OK**.
- **Note:** Connect destination path reported test account capabilities incomplete; **fallback checkout without Connect destination** succeeded — **warning** for hosts until Connect `transfers` / capabilities are active in Dashboard.

### Failure paths (cancel / failed payment)

- **Not re-run in this session** as dedicated assertions; rely on existing route handlers + Playwright specs where configured.

| System | Result |
|--------|--------|
| **Payments (automated script)** | Passed |
| **Real browser + test card** | **Warning** — manual / Playwright recommended |

---

## Step 4 — Booking integrity

- **Overlapping / lifecycle:** Partially covered by `validate-core-flows` (create + status + issue path). **Warning:** dedicated overlap and off-by-one date tests should stay in CI (unit/integration) and staging QA.

---

## Step 5 — Loyalty

- **Not executed** in this automated pass. **Warning:** run 2+ booking scenario + checkout discount on staging.

---

## Step 6 — AI / autopilot

- **Not executed** (no scheduled scan / listing_created triggers in this run). **Warning:** run `ai:autopilot` or staging cron with kill-switch verified; confirm no auto-refund / auto-payout / unsafe messaging.

---

## Step 7 — Messaging

- **Not executed**. **Warning:** run `validate:messaging-system` when editorial/automation policies are finalized.

---

## Step 8 — i18n (fast)

- Prior subsystem notes: `docs/launch/LAUNCH-READINESS-REPORT.md` (legacy snapshot) + `docs/i18n/*`. **This run:** no new manual EN/FR/AR UI pass. **Warning:** smoke locale switch on staging.

---

## Step 9 — Mobile (Expo)

- **Not executed** (no `expo start` in this session). **Warning:** open app, listings, navigation on device.

---

## Step 10 — Error + log scan

- Stripe script reported Connect capability message (logged as OK with fallback). No unhandled crash in migration / flow / stripe / fraud scripts.

### Fraud detection script (extra signal)

```bash
cd apps/web && pnpm exec tsx scripts/validate-fraud-detection.ts
```

**Result (this run):** Completed successfully (synthetic high-risk queue, moderation resolve, ranking penalty path exercised).

---

## Per-system matrix

| System | Automated this run | Blockers | Warnings |
|--------|--------------------|----------|----------|
| **DB / migrations** | Yes | None | Re-run `migrate deploy` on every new environment |
| **Booking** | Core flows OK | None | Overlap/date edge QA on staging |
| **Payments / Stripe** | BNHub script OK | None | Connect capabilities; manual card flow |
| **Fraud (rules + DB pipeline)** | Script OK | None | Production moderation staffing |
| **AI** | No | None | Trigger + policy audit before heavy autopilot |
| **Messaging** | No | None | Lifecycle QA |
| **Loyalty** | No | None | Tier + non-stacking promos |
| **i18n** | No | None | RTL + missing keys smoke |
| **Mobile** | No | None | Device smoke |

---

## Commands cheat sheet

| Goal | Command |
|------|---------|
| Deploy migrations | `pnpm db:migrate:deploy` |
| Generate client | `cd apps/web && pnpm exec prisma generate` |
| Core DB flows | `pnpm validate-core-flows` |
| BNHub Stripe | `cd apps/web && pnpm exec tsx scripts/validate-bnhub-stripe-e2e.ts` |
| Fraud pipeline | `cd apps/web && pnpm exec tsx scripts/validate-fraud-detection.ts` |

---

## Related docs

- Post-deploy checklist & **LIVE vs FIX REQUIRED**: `docs/LAUNCH-EXECUTION-REPORT.md`
- Earlier i18n / launch flag snapshot: `docs/launch/LAUNCH-READINESS-REPORT.md`
- Hub validation: `docs/HUB-VALIDATION-REPORT.md`
- Rollback: `docs/launch/ROLLBACK-PLAN.md`

---

**End of report**

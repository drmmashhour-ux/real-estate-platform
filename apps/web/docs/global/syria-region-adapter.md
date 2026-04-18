# Syria region adapter (read-only)

## Why Syria stays isolated

- `apps/syria` keeps its own Prisma schema, generated client, and business code. It does not import `apps/web` internals.
- `apps/web` does **not** merge Prisma schemas with Syria. Cross-surface access is **read-only** against the same PostgreSQL `DATABASE_URL` using **raw SQL** or the web app’s Prisma client as a query transport only.
- This phase does **not** write to `syria_*` from `apps/web` and does **not** enable execution or autonomy in Syria.

## How the adapter works

- **Feature flag:** `FEATURE_SYRIA_REGION_ADAPTER_V1` (default off; set to `1` or `true` to enable).
- **Code path:** `modules/integrations/regions/syria/syria-read-adapter.service.ts` issues `prisma.$queryRaw(Prisma.sql\`…\`)` against `syria_properties`, `syria_bookings`, `syria_payouts`, `syria_listing_payments`, and `syria_users`.
- **Normalizers** map DB rows to `SyriaNormalized*` types in `syria-region.types.ts` and `syria-normalizer.service.ts`.
- **Region facade:** `syria-region-adapter.service.ts` is the only supported import path for product code; the **region registry** (`region-adapter-registry.ts`) maps `regionCode` `sy` to that adapter.
- **Global layers:** `global-unified-intelligence.service.ts` and `global-dashboard.service.ts` merge Syria snapshots into admin-level read models. **Québec / OACIQ legal engines are not applied**; we only carry **indicators and notes** (see `syria-region-trust-risk.service.ts`).

## What is normalized

- **Listings:** id, source, `regionCode: "sy"`, price, currency, type, status, `fraudFlag`, `isFeatured`, booking count hint, payout state hint, timestamps.
- **Bookings / users / payouts:** mapping functions exist for future use; aggregates are the primary V1 focus.
- **Region summary:** listing and booking counts, BNHub-typed property count, gross booking sum (non-cancelled), payout status counts, verified listing payment count, generated at `computedAt`.

## Capabilities today (V1)

- Read listing by id, regional aggregate summary, per-listing booking stats, per-user stats, flagged listing list (deterministic sort).
- **Global dashboard** (`buildMarketplaceDashboardSummary`) can include `kpis.syria`, `risk.syria`, `growth.syria`, and `regionComparison` when the flag is on and the database is reachable.
- **API:** `GET /api/admin/global-region?region=sy` (admin session required) returns region summary + capability notes + trust-risk overlay (still **indicator-only**).

## Intentionally unsupported (V1)

- Québec broker compliance scoring on Syria entities.
- Automated payouts, booking mutations, listing writes, or autonomy execution from `apps/web`.
- Raw payment credentials, card numbers, or manual payment proofs in API payloads (admin routes return aggregates and hints only).

## Future expansion

1. **Syria legal pack** — optional jurisdiction-specific policies **without** reusing Québec rules as a proxy.
2. **Syria trust pack** — richer trust dimensions once Syria-native signals exist (reviews, KYB, etc.).
3. **Syria preview / autonomy** — read-only preview first; execution only behind explicit gates and Syria-side consent.

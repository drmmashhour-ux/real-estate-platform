# Business-first platform upgrade sequence (LECIPM)

This document maps the **priority upgrade sequence** to **existing, additive modules** in the repo. It is the operator-facing index for revenue, conversion, trust, and control—without replacing per-feature docs.

**Principles:** revenue and conversion before extra AI complexity; Stripe/booking/ranking/lead cores are not rewritten here—only wrapped or gated where noted.

---

## Phase 1 — Revenue enforcement layer

**Goal:** Monetization visibility and safe scope around revenue tooling; avoid giving away paid value without control.

| Capability | Location (indicative) |
|------------|------------------------|
| Revenue event audit / summaries | `lib/monetization/revenue-events.ts`, `PlatformRevenueEvent` |
| Revenue autopilot API scope guard | `lib/revenue-autopilot/revenue-guard.ts` (`requireRevenueScope`) |
| BNHub booking revenue hooks | `lib/monetization/bnhub-guest-booking-revenue.ts` |
| Revenue control / admin finance | Admin finance + `REVENUE_CONTROL` patterns (see `docs/deployment` / finance docs) |

**Strict:** Stripe integration code paths are not duplicated here—guards wrap admin/operator APIs.

**Flags:** Feature-gated revenue surfaces (e.g. growth revenue panel, revenue autopilot) via `config/feature-flags.ts` and env.

---

## Phase 2 — Broker acquisition system

**Goal:** Lightweight pipeline for first paying brokers; daily-usable, not a full CRM replacement.

| Capability | Location |
|------------|----------|
| Prospect CRM (DB) | Prisma `BrokerProspect` / migrations under `broker_prospects` |
| Admin console | `app/.../admin/brokers-acquisition/` (`BrokerPipelineDashboard` V1); legacy DB UI: `admin/broker-acquisition-legacy` |
| Growth Machine strip | `BrokerAcquisitionPanel`, `GET /api/growth/broker-acquisition` |
| Scripts library | `modules/growth/broker-acquisition-scripts.ts` |
| Masked lead preview | `modules/growth/lead-preview.service.ts` |

**Flag:** `FEATURE_BROKER_ACQUISITION_V1` (see `.env.example`).

---

## Phase 3 — Instant value / conversion layer

**Goal:** Faster value and clearer CTAs on key surfaces; real data only.

| Capability | Location |
|------------|----------|
| Marketing / homepage CTAs | `(marketing)` pages, conversion components (`components/conversion/`, `PrimaryConversionCTA`, etc.) |
| Listings / property detail | Browse + detail clients under `components/listings/`, `app/listings/` |
| Intent routing | Hub navigation, role-based dashboards, signup flows |

**Strict:** No synthetic urgency; copy and components should reflect stored metrics and honest states.

---

## Phase 4 — BNHub guest conversion layer

**Goal:** Guest-side marketplace loop diagnostics (advisory).

| Capability | Location |
|------------|----------|
| Guest conversion metrics | `modules/bnhub/guest-conversion/` |
| Mission control + host UI | BNHub host dashboard, guest conversion panel components |
| Feature flags | `FEATURE_BNHUB_GUEST_CONVERSION_*`, etc. (`config/feature-flags.ts`) |

**Strict:** No booking/Stripe mutation from this layer—read-only and feature-flagged.

---

## Phase 5 — Revenue dashboard

**Goal:** Operators see where money comes from.

| Capability | Location |
|------------|----------|
| Growth Machine revenue panel | `GrowthRevenuePanel`, `modules/revenue/revenue-aggregator.service.ts`, `/api/growth/revenue` |
| BNHub admin revenue | `admin/revenue-dashboard`, `lib/bnhub/revenue-dashboard.ts`, `/api/admin/bnhub-revenue-dashboard` |
| Investor / CEO links | Admin hub pages linking to revenue dashboards |

**Flag:** `growthRevenuePanelV1` / `FEATURE_GROWTH_REVENUE_PANEL_V1` pattern on growth page.

---

## Phase 6 — Growth policy enforcement layer

**Goal:** Gate **non-critical advisory** flows (learning, fusion bridges, content/messaging assists, mission control promotions)—not payments or core ads/CRO execution.

| Capability | Location |
|------------|----------|
| Snapshot + API | `growth-policy-enforcement.service.ts`, `GET /api/growth/policy-enforcement` |
| Bridges | `growth-policy-enforcement-bridge.service.ts` |
| Panel + badges | `GrowthPolicyEnforcementPanel`, enforcement snapshot on Fusion/Learning/Autopilot/Mission Control |

**Flags:** `growthPolicyEnforcementFlags` in `config/feature-flags.ts`.

---

## Phase 7 — Mission Control refinement

**Goal:** Single shared context load where possible; advisory-only console.

| Capability | Location |
|------------|----------|
| Mission Control assembly | `growth-mission-control.service.ts`, `loadGrowthMissionControlBuildContext()` |
| Notes from memory / knowledge graph / decision journal | Bridges in mission control (feature-flagged) |
| Checklist / risks / review queue | `growth-mission-control-*.service.ts` |

**Strict:** No rewrite of booking or payments; optional deduplication via shared context loader.

---

## Validation (examples)

```bash
cd apps/web
pnpm exec vitest run modules/growth/__tests__/growth-policy-enforcement --reporter=dot
pnpm exec vitest run lib/monetization --reporter=dot
pnpm exec vitest run modules/bnhub/guest-conversion/__tests__ --reporter=dot
```

Adjust paths to match your test layout.

---

## Summary

The sequence is **implemented as modular, additive layers** with **defaults OFF** where feature flags apply. Extend each phase by editing the referenced modules and adding tests/docs next to those modules—avoid a second parallel “framework” unless product requires it.

# Lead pricing experiments & operator overrides

Internal **admin/operator** tooling only. This document describes what the system does, how display precedence works, and explicit non-goals.

## What experiments are

**Pricing experiments** are deterministic, side-by-side **advisory** lanes built from the **same signals** already used by dynamic pricing and monetization control (quality, demand, broker interest, optional conversion nudge). They answer: “If we emphasized quality vs demand vs a tighter cap vs a stronger (still bounded) uplift, what figures would we see?”

Modes:

| Mode | Meaning |
|------|---------|
| `baseline` | Revenue-engine **base reference only** — no layered multiplier in this lane. |
| `quality_weighted` | Same layers as production, but **quality exponent ↑** and demand/broker slightly damped. |
| `demand_weighted` | **Demand exponent ↑** — stresses market density signals vs pure quality scaling. |
| `conservative` | Uses the full layer product but caps total uplift at **×1.35** (vs **×2** for standard advisory dynamic pricing). |
| `aggressive` | Layers nudged upward via exponents — still capped at the same **×2** global advisory ceiling. |

Nothing here is persisted automatically. Nothing here changes Stripe, checkout, or lead submission.

## What an override is

An **operator override** is an explicit row in `lead_pricing_overrides`: operator-entered dollars + **required reason** + snapshots of base and system-suggested prices at decision time. It is an **internal decision record** for review and coaching.

- At most **one** row with `status = active` per lead; a new override **supersedes** the previous active row (marked `superseded`).
- **Clear** sets `status = cleared` (audit trail retained).
- Overrides **do not** modify `Lead` fields, `dynamicLeadPriceCents`, or any billing artifact.

## Display precedence (internal UI only)

When showing an **effective internal advisory price** in admin tooling:

1. **Active operator override** (`overridePrice`) when present.
2. Else **monetization control primary suggested price**.
3. Else **revenue-engine base** fallback.

This precedence **does not** imply live pricing mutation. Checkout and unlock flows continue to use existing revenue rules unless separately changed in a future, explicitly scoped project.

## Feature flags (default off)

- `FEATURE_LEAD_PRICING_EXPERIMENTS_V1` — experiment comparison on lead detail API + UI.
- `FEATURE_LEAD_PRICING_OVERRIDE_V1` — persistence + admin API for overrides.
- `FEATURE_LEAD_PRICING_OVERRIDE_PANEL_V1` — operator UI to apply/clear overrides (requires override V1).

## Monitoring & audit

Console logs use prefix **`[lead:pricing-experiments]`** for bundles, overrides, supersede/clear events, low-confidence notices, and display precedence. Override changes also emit **`override_audit`** JSON lines with action and before/after snapshots where applicable.

## What this system does **not** do

- Does **not** change Stripe, payment intents, checkout routes, or broker/client surfaces.
- Does **not** auto-apply advisory prices publicly or to unlock SKUs.
- Does **not** alter `computeLeadValueAndPrice` outputs globally.
- Does **not** replace monetization control — it extends operator learning and explicit decisions.

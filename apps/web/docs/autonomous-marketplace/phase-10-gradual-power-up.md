# Phase 10 — gradual power-up

Roll out autonomy **without** touching BNHub, Stripe, or booking flows until each phase is verified.

## Gold rules

1. **Never start with execution** — defaults stay dry-run / preview-only.
2. **Always preview first** — `POST /api/autonomy/preview` with `{ "listingId": "..." }` uses `previewForListing` (read-only signals, opportunities, policy decisions; **no executor**, no `AutonomousMarketplaceRun` write for listings).
3. **Always enforce policy** — preview uses listing preview policy rules; full runs use `evaluateActionPolicy`.
4. **Always log** — engine + `[autonomous-marketplace]` logs; controlled path adds audit rows when flags are on.
5. **Feature flags OFF by default** — enable only after each phase passes tests (`FEATURE_*` in `.env.example`).

## Suggested enable order

| Order | Capability | Notes |
|-------|------------|--------|
| 1 | Preview + insights | No execution flags required beyond `FEATURE_AUTONOMOUS_MARKETPLACE_V1` for admin preview API. |
| 2 | Price **suggestions** (not apply) | Detector/policy only; `SUGGEST_PRICE_CHANGE` stays advisory / dry-run in apply layer. |
| 3 | Promotion **suggestions** | Same — suggestions only until product allows. |
| 4 | Budget **suggestions** | Campaign hints; no spend APIs from this module. |
| 5 | Later | `FEATURE_CONTROLLED_EXECUTION_V1` — **CREATE_TASK** / **FLAG_REVIEW** only when gate allows. |

## How you know it’s working

- Preview returns `signals`, `opportunities`, `actions`, `decisions` and `executionResult.status === "DRY_RUN"`.
- Modes on **full runs** change governance outcomes; preview listing uses autonomy mode OFF for policy evaluation (read-only posture).
- No Stripe webhooks or BNHub booking mutations are invoked from preview or dry-run executor paths.

## What this module does not touch

Payments, payouts, reservations, and BNHub checkout — keep those paths separate; autonomy stays advisory until explicitly gated elsewhere.

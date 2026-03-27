# Core investment hub (primary product)

`INVESTMENT_HUB_FOCUS` in `apps/web/lib/product-focus.ts` steers the main UX toward the investment product without deleting other hubs.

## Primary routes

| Route        | Role                                      |
| ------------ | ----------------------------------------- |
| `/`          | Landing + investment nav (`MvpNav`)       |
| `/analyze`   | Deal analysis                             |
| `/dashboard` | Portfolio (investment MVP)                |
| `/compare`   | Side-by-side comparison                   |
| `/deal/[id]` | Deal detail / share                     |

Demo equivalents: `/demo/dashboard`, `/demo/compare` (guest / no-login flows).

## Global chrome

- **`HeaderGate`**: On investment-shell paths (see `isInvestmentShellPath()`), the global `HeaderClient` is **hidden** so it does not duplicate `MvpNav`.
- **Exact `/dashboard`**: Treated as the investment portfolio shell. Subpaths like `/dashboard/broker` still get the global header so other hubs stay usable when deep-linked.
- **`GrowthConversionLayer`**: Mortgage/growth sticky UI is suppressed on investment-shell paths when `INVESTMENT_HUB_FOCUS` is true.

## Navigation

- **Investment pages**: `MvpNav` — Home, Analyze, Dashboard, Compare.
- **All other pages** (blog, secondary hubs, etc.): `HeaderClient` — Analyze, Dashboard, Compare; auth links when logged out. BNHub, mortgage, and admin are not linked from this bar (admin remains reachable via direct URL, e.g. `/admin/...`).

## Homepage copy

The landing page shows: **Core Platform: Real Estate Investment Intelligence** (under `MvpNav`).

## Intended demo flow

Analyze → Save (local/browser) → Dashboard → Compare → Share (deal link).

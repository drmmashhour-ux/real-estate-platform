# Action simulation engine (scenario lab)

## Implementation contract (reminder)

**Do not:** claim certainty; auto-run approved work; invent missing metrics; bury assumptions behind slick UI.

**Do:** conservative classification; explicit risks + assumptions + confidence; understandable copy; routes and panels remain **read-only advisory** — comparison is for judgment before approval, not execution.

## What this is

An **internal-only** helper that answers: *“If we pursue this initiative, what **directional** effects appear plausible given stored CRM and growth telemetry?”*

Outputs are **simulations**, not audited forecasts. They bundle:

- **Baseline snapshot** — counts and ratios computed from existing services (no invented dollars).
- **Scenario rules** — deterministic, typed mappings from action category → metric-level directional hints.
- **Risk / assumptions** — explicit uncertainty and capacity caveats.

## What this is not

- Not a guaranteed outcome or revenue promise.
- Not causal inference (“this action **will** lift revenue”).
- No Stripe, billing, bookings, outbound messaging, or automated execution — **POST routes are read-only** on persistence.

## How outcomes are estimated

1. **`buildSimulationBaseline`** pulls parallel read-only aggregates (lead counts, FSBO listings, illustrative revenue forecast when enabled, Fast Deal aggregates, broker lock-in summaries, weekly review hooks, capital allocation plan availability, execution-results summaries). Missing inputs stay **undefined** with **warnings**.
2. **`applySimulationRules`** attaches bounded **effect rows** (`up` | `flat` | `down` | `uncertain`) with **magnitude bands** (`low` | `medium` | `high` | `unknown`).
3. **`buildRisksAndAssumptions`** layers operator-facing caveats (capacity, geo precision, overload).
4. **`classifyOverall`** maps to **favorable | mixed | weak | insufficient_data** using conservative thresholds (see tests + service).

## Confidence

Per-effect **confidence** folds baseline quality + rule intrinsic confidence (never upgraded above telemetry quality). **`overallRecommendation: insufficient_data`** fires when baseline confidence is low and warnings / uncertainty saturate (see `action-simulation.service.ts`).

## Operators should…

- Run simulations **before** approving heavy execution-plan tasks or reallocations.
- Pair outputs with qualitative judgment — especially when baseline warnings mention sparse Fast Deal / forecast data.
- Treat illustrative **revenueEstimate** as a CRM-derived illustration, **not** cash recognition.

## Flags

- `FEATURE_ACTION_SIMULATION_V1` — `/api/growth/action-simulation` POST.
- `FEATURE_ACTION_SIMULATION_PANEL_V1` — Growth Machine lab UI + shortcuts from adaptive / planner / allocation / expansion panels.
- `FEATURE_ACTION_SIMULATION_COMPARISON_V1` — `/api/growth/action-simulation/compare` + comparison panel.

Default: **off** until env enabled.

# Growth autonomy learning loop

## What it does

The learning loop observes **operator-facing autonomy suggestions** (shown, taps, prefills used, completions, ignores, structured feedback). It persists lightweight aggregates and adjusts **bounded numeric weights** per catalog category. Those weights influence **ordering** and optional **temporary soft-hide** (`hidden` disposition) for **advisory / prefilled** rows only—never policy blocks, approvals, or enforcement outcomes.

Operators see **plain-language explanations** derived from effectiveness bands and current weight deltas (not “model opacity”).

## What it does not do

- Does **not** execute payments, booking core, ads core, or CRO experiments.
- Does **not** create new action types or bypass policy enforcement, rollout stages, or the autonomy kill switch.
- Does **not** permanently delete categories from the catalog; suppression is **time-boxed** and reversible.
- Does **not** claim confidence when data is sparse—those categories stay **`insufficient_data`**.

## Signals used

Stored per category id (aligned with `GROWTH_AUTONOMY_CATALOG`):

| Signal | Meaning |
|--------|---------|
| `shown` | Suggestion surfaced to the operator |
| `interacted` | Explicit interaction (e.g. opened prefill target) |
| `prefill_used` | Prefill action used |
| `completed` | Operator marked completion |
| `ignored` | Explicit ignore signal |
| `feedback_helpful` / `feedback_not_helpful` | Thumb feedback |
| `confusion` | Confusion marker |

Effectiveness combines interaction rate, completion rate, feedback ratio, and confusion rate into a **numeric score** and **band**: `strong`, `good`, `weak`, `poor`, or **`insufficient_data`** when observed samples are below `GROWTH_AUTONOMY_LEARNING_MIN_OBS`.

## How priorities adapt

On a **throttled learning cycle** (server-side):

1. Categories with **`insufficient_data`** are skipped—no weight change.
2. **Poor** effectiveness plus **high ignore rate** (with enough observations) triggers **temporary suppression** (cooldown timestamp) plus a **down-weight**.
3. Sustained **negative feedback** (with enough feedback volume) triggers **down-weight**.
4. **Strong/good** effectiveness plus minimum interaction and completion ratios triggers a **small up-weight**.
5. **Weak/poor** bands without stronger triggers get a **half-step down-weight**.

All deltas pass through **clamp** bounds (`GROWTH_AUTONOMY_LEARNING_MAX_UP` / `MAX_DOWN`).

## Safety bounds

- **Step sizes** (`STEP_UP` / `STEP_DOWN`) and **absolute caps** on stored weights.
- **Minimum observations** before non-neutral effectiveness.
- **Suppression cooldown** — categories can become visible again after `COOLDOWN_MS`; aggregates are **not** wiped automatically.
- **Freeze** — operators can freeze learning so weights still load but **`adaptiveInfluenceAllowed`** is false.

## Manual override flow

Use **POST `/api/growth/autonomy/learning/control`** (authenticated admin paths as implemented):

- **`reset_weights`** — clears weight deltas and suppression timers; timestamps manual reset on control flags.
- **`freeze`** / **`unfreeze`** — stops adaptive ranking influence while frozen.

Inspect current state via **GET `/api/growth/autonomy/learning`** when the panel flag allows.

## Feature flags

| Flag | Purpose |
|------|---------|
| `FEATURE_GROWTH_AUTONOMY_LEARNING_V1` | Master switch for persistence, cycles, and orchestrator ranking influence |
| `FEATURE_GROWTH_AUTONOMY_LEARNING_PANEL_V1` | Operator UI panel + GET API allowance |

Learning can be disabled while base autonomy (`FEATURE_GROWTH_AUTONOMY_V1`) stays on.

## Kill switch interaction

When **`FEATURE_GROWTH_AUTONOMY_KILL_SWITCH`** is on:

- Event ingestion should reject adaptive writes (routes check kill switch).
- Orchestrator **does not apply** learned ordering (`adaptiveInfluenceAllowed` false).
- Embedded snapshot may still return **read-only diagnostics** (`adaptiveInfluenceActive: false`) when learning flag is on—**no live adaptive influence**.

## How to audit decisions

1. Open the **Growth autonomy learning panel** (when enabled) or GET the learning API.
2. For each category, read **effectiveness band**, **stored weight delta**, **suppression expiry**, and the **deterministic explanation** string.
3. Correlate with **`GrowthAutonomyLearningRecord`** rows in the database (append-only events) for raw timelines.

## Known limitations

- Does not infer causality—only correlates surfaced suggestions with coarse engagement.
- Conversion/revenue lifts are **not wired** unless you extend aggregates with measurable downstream keys later.
- Throttling batches rapid cycle triggers—near-simultaneous events may collapse into fewer persisted cycles.

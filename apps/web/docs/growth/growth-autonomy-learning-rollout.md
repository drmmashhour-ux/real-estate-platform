# Growth autonomy learning loop — rollout

Practical staged rollout for **`FEATURE_GROWTH_AUTONOMY_LEARNING_V1`** and **`FEATURE_GROWTH_AUTONOMY_LEARNING_PANEL_V1`**.

## Stage 0 — Off (default)

- No learning persistence, no ranking influence.
- Base growth autonomy behaves as today.

## Stage 1 — Internal / shadow read-only

**Env**

- `FEATURE_GROWTH_AUTONOMY_LEARNING_V1=1`
- `FEATURE_GROWTH_AUTONOMY_LEARNING_PANEL_V1=1` (operators only)
- Keep **`GROWTH_AUTONOMY_LEARNING_MIN_OBS`** at default or **higher** to force **`insufficient_data`** until traffic exists.

**Goal**

- Validate DB migration, append-only records, and panel UX.
- Optionally **freeze** learning (`/learning/control` `freeze`) so operators see diagnostics without adaptive ranking.

## Stage 2 — Bounded adaptive ranking (partial operators)

**Env**

- Same flags; ensure **`FEATURE_GROWTH_AUTONOMY_KILL_SWITCH`** is **unset** in normal operation.
- Tune **`STEP_UP` / `STEP_DOWN`** conservatively; keep **`MAX_UP` / `MAX_DOWN`** tight.

**Goal**

- Allow **modest ordering changes** and rare **temporary soft-hide** for noisy advisory rows.

**Rollback**

- Set **`FEATURE_GROWTH_AUTONOMY_LEARNING_V1=0`** immediately (disables adaptive influence).
- Or enable kill switch for autonomy-wide suppression.
- Or call **`reset_weights`** + **`freeze`** for a softer stop.

## Stage 3 — Production full (optional)

- Only after stable metrics on engagement quality and operator trust.
- Keep panel internal; do not surface learning copy to external users.

## Preconditions checklist

- [ ] `pnpm prisma migrate deploy` applied (`GrowthAutonomyLearningState`, `GrowthAutonomyLearningRecord`).
- [ ] Monitoring dashboards or log tail for prefix `[growth:autonomy:learning]`.
- [ ] Runbook: who may call admin control routes and when to freeze.

## What to watch

- Spike in **`insufficient_data`** — expected early; avoid tuning steps until volumes grow.
- Sudden **`categoriesSuppressed`** — verify poor/ignore pattern is genuine, not a UI bug.
- **`manualResets`** in monitoring — trace policy or product issues, not model “drift.”

# Growth Retargeting durability & Autopilot (rollout notes)

## What this covers

- **Growth Retargeting Engine** UI (`GrowthRetargetingEngineSection.tsx`): durability health, learned message lists (DB vs in-memory), negative-signal block, bookings attributed from performance cache.
- **Autopilot adapters**: `retargeting.autopilot.adapter.ts` (three recommendation-only actions) and `ads-automation-loop.autopilot.adapter.helpers.ts` (ads loop proposals with unified snapshot + SQL low-conversion caution).

## Persistence / durability behavior

- When `FEATURE_CRO_RETARGETING_PERSISTENCE_V1` or `FEATURE_CRO_RETARGETING_DURABILITY_V1` is on, the section awaits `loadPersistentCroRetargetingLearning()` and `retargetingPerformanceReady()` before reads.
- Durability repository calls are **caught** — failures degrade to `null` health or `[]` lists without crashing the server component render.

## UI data source priority

1. **Top / weak lists**: Prefer `getTopRetargetingMessagesBySegmentDurability` / `getWeakRetargetingMessagesDurability` when durability flag is on **and** rows exist.
2. Otherwise: in-memory `getTopMessagesBySegment` / `getWeakMessages`.
3. **Label**: `resolveLearnedListSourceLabel()` clarifies when durability snapshots exist but **DB list queries are empty** — ranked lists may still come from the in-memory cache (avoids “SQL-backed” mislabeling).

## Source labeling

- **SQL-backed**: durability health shows performance snapshots (`performanceSnapshots > 0`) with normal list resolution.
- **SQL + memory clarification**: DB durability present but DB-ranked lists empty while memory has rankings.
- **In-memory (hydrated)**: performance cache hydrated with rows, no DB snapshot dominance.
- **Insufficient data**: default heuristic path.

## Autopilot confidence unification

- `computeUnifiedAutopilotConfidence(base)` in `unified-learning.service.ts` caps/boosts using `buildUnifiedSnapshot()` (evidence quality, persisted signal totals, optional SQL low-conversion flags).
- **Non-finite `base`** is treated as **0.5** (additive guard) so callers never propagate NaN.

## monitorHold (retargeting adapter)

- Applies to the **high-intent** action copy when persistence/durability is on, **durable volume &lt; 4**, and unified evidence is not **HIGH**.
- Does not change severity/risk level; informational summary only.

## Feature flags (see `apps/web/.env.example`)

- `FEATURE_CRO_RETARGETING_PERSISTENCE_V1`
- `FEATURE_CRO_RETARGETING_DURABILITY_V1`
- `FEATURE_NEGATIVE_SIGNAL_QUALITY_V1`
- Plus standard growth/autopilot gates (`FEATURE_GROWTH_MACHINE_V1`, `FEATURE_AI_AUTOPILOT_V1`, etc.).

## Known validation limitations

- Full `apps/web` `tsc --noEmit` may **OOM** in some environments; use `NODE_OPTIONS=--max-old-space-size=8192` if needed.
- **Prisma**: run `npx prisma validate` / `npx prisma generate` from `apps/web` after schema changes (none required for these UI/helper edits alone).

## Recommended local / CI commands

```bash
cd apps/web && npx prisma validate && npx prisma generate
cd apps/web && npx vitest run modules/growth/growth-retargeting-ui-helpers.test.ts modules/ai-autopilot/actions/retargeting.autopilot.adapter.test.ts
cd apps/web && pnpm run ci:typecheck
cd apps/web && pnpm run build
```

Adjust package scripts to match your `package.json` (`ci:typecheck` / `build` names).

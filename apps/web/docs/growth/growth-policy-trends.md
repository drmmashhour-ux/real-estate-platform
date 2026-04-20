# Policy safety trends (V1)

This layer answers: **“Does the policy engine’s output look calmer or noisier over the last 7/30 UTC days?”** It is **advisory only** — it does not change policy results, payouts, bookings, CRM, or marketing automation.

## Data source (no fabrication)

Trends come only from **`growth-policy-trend-daily.json`** (or `GROWTH_POLICY_TREND_JSON_PATH`) populated when **`FEATURE_GROWTH_POLICY_TRENDS_V1`** is on and **`GET /api/growth/policy`** runs: each evaluation **overwrites that UTC day’s rollup** with the latest counts observed (critical / warning / info totals, recurrence counts aligned with fingerprint history rows, resolved-review counts from review records that day).

Missing UTC days contribute **zeros** with `hasData: false` — **no interpolation**.

## What “improving / worsening / stable” means

For each aggregate (overall risk proxy, severity mass, recurrence mass), we split the calendar window into **two contiguous halves** (first vs second).

- **Improving**: recent-half mass is **>8% lower** than the prior half (relative to `max(1, prev, recent)`).
- **Worsening**: recent-half mass is **>8% higher**.
- **Stable**: inside that band.

Overall risk proxy per day:

`3×critical + warning + 0.25×info + 2×recurring` (only on days with `hasData`).

Severity trend compares **critical + warning** totals per half. Recurrence trend compares **recurring observation counts** per half.

Domains compare summed **daily snapshot domainCounts** across the same halves.

Strings explicitly say **correlation, not causation**.

## Insufficient data

Marked **`insufficient_data`** when:

- **`windowDays < 4`**, **or**
- Fewer than **`3` UTC days** contain any snapshot (`hasData`).

When insufficient, directional trends are **`insufficient_data`** and confidence is **low**.

## Confidence

Heuristic:

- **High**: ≥10 snapshot days **and** ≥60% of window days filled.
- **Medium**: ≥5 snapshot days **and** ≥35% filled.
- **Low**: otherwise (sparse polling).

## Weekly review usage

1. Enable trend + panel flags; ensure policy GET runs on working days so UTC buckets fill.
2. Read **overall / severity / recurrence** badges together — severity can worsen while recurrence eases if operators cleared stale fingerprints.
3. Treat **resolved review counts** as **activity**, not proof that production risk vanished.
4. Prefer acting on **current findings** + **history**; use trends only as cadence signal.

Log prefix: **`[growth:policy-trends]`**.

## Attribution

Trend arrows describe **half-over-half differences on stored UTC snapshots** — **not** proof that an operator action caused improvement or degradation. Compare **confidence** and **warnings** before acting; keep **current policy findings** authoritative. See **`growth-policy-attribution.md`**.

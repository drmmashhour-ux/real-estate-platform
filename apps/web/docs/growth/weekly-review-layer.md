# Weekly operator review layer

Summarizes **what happened in the Fast Deal execution loop** over the latest window versus the immediately prior window of equal length. Optional merge of sparse warnings from the Growth Execution Results layer when that engine is enabled.

## What is measured

- **Execution counts (current window):**
  - Landing captures (`landing_capture` / `lead_submitted`)
  - Broker sourcing touches (`broker_sourcing` `session_started` or `broker_found_manual`)
  - Playbook completions (`closing_playbook` / `playbook_session_completed`)
- **City bundle:** When city comparison is enabled, **top** and **weakest** cities come from the Fast Deal leaderboard for the same window length (not a second historical pull).
- **Major changes:** Includes week-over-week deltas for the three execution counters plus optional execution-results sparse warning text.

## Classification rules

Executed in `weekly-review-analysis.service.ts`:

- **Insufficient:** total Fast Deal source events in the current window **&lt; 12**, or zero sourcing + zero landing logs, or volume **&lt; 12** for reliable deltas (see `MIN_VOLUME = 12` for headline WoW comparisons).
- **Positive:** vs prior window — leads Δ ≥ **+2**, sourcing Δ ≥ **+2**, or playbook completions Δ ≥ **+1** (when volume threshold met).
- **Negative:** leads Δ ≤ **−2**, sourcing Δ ≤ **−2**, or playbook completions Δ ≤ **−1**.

These are **associational** signals — not proof that operators “did well” or “badly”.

## Recommendations

`weekly-review-recommendations.service.ts` emits deterministic strings only:

- Sparse week → “do not expand geographic focus yet…”
- Falling leads with a known top city → review attribution for that city.
- Falling playbooks with a weakest city → audit playbook discipline for that market.
- **Priority focus** capped at **3** lines.

## Meta confidence

- **high:** ≥45 Fast Deal events in current window  
- **medium:** ≥20  
- else **low**

## Safety

- Internal Growth Machine APIs only (`requireGrowthMachineActor`).
- Does not enqueue outreach, change billing, or mutate leads/brokers automatically.

## Flags

- `FEATURE_WEEKLY_REVIEW_V1`
- `FEATURE_WEEKLY_REVIEW_PANEL_V1`

Default: **off**.

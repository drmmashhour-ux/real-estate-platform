# Weekly team operating review

Meeting-oriented summary built from internal growth signals only — **no payments, no outbound automation, no implied ROI**.

## How summaries are built

The engine (`weekly-team-review.service.ts`) merges, when respective feature flags exist:

| Layer | Contribution |
|-------|----------------|
| CRM (`Lead`) | Pipeline counts by `pipelineStage` for the rolling window vs prior window |
| Coordination (`getCoordinationSummary`) | Tasks done / in-flight / blocked |
| Execution planner (`buildExecutionPlan`) | Adds blocked-task count to blocked total |
| Accountability store | Completion rate + pitch-script copy counts |
| Weekly operator review (`buildWeeklyReviewSummary`) | City leaderboard + narrative deltas |
| Growth execution results (`buildGrowthExecutionResultsSummary`) | Measurement bands for “deal performance” hints |

Confidence tier uses a simple **activity score**: leads (current+prior windows) + assignments + planner tasks — high/medium/low thresholds are conservative.

## Classification (`weekly-team-review-analysis.service.ts`)

Signals bucket into **positive**, **negative**, **neutral**, **insufficient** without ML — rules compare execution completion rate, blockers vs in-flight work, lead Δ, qualified share, and optional scale-system positivity.

## Insights (`weekly-team-review-insights.service.ts`)

At most **five** leadership-style lines — advisory language by design.

## Limitations

- Does **not** prove causation between Growth Machine panels and revenue.
- City bundle requires Fast Deal comparison when enabled upstream.
- Coordination data is **in-memory** — resets on deploy.

## Monitoring

Logs use prefix **`[weekly-review]`** for builds and failures.

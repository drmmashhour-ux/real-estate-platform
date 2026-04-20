# Policy → action → result attribution (operator contract)

This note ties together the **Growth Policy Engine**, **Action Bridge**, **Review History**, and **Trend summaries**. It does **not** introduce automatic linking, execution, or causal inference in code.

## Principles

1. **Live policy output is primary** — `GrowthPolicyResult[]` from evaluation is always the current safety signal list. Nothing in history, trends, reviews, or actions hides or edits that list.
2. **Actions are explicit navigation** — Open / Review URLs are labeled links to surfaces operators should inspect. **No autonomous execution.** Following a link does not submit reviews, clear findings, or change Stripe/checkout/leads/booking state from this layer.
3. **No causal claims** — Improvements or regressions in trends compare **stored UTC snapshots** half-over-half. That is **descriptive correlation in time**, not proof that an operator action (or absence of action) caused a change in risk.
4. **Reviews require humans** — `GrowthPolicyReviewRecord` rows are intentional labels (`acknowledged`, `monitoring`, `resolved`, `recurring`, `false_alarm`). They **do not auto-resolve** findings and **do not auto-link** to actions; operators connect intent in process, not via hidden joins in this codebase.
5. **Conservative before vs after** — Trends and recurrence views use **explicit counts and dates** where available. Missing UTC days remain visible as gaps (**no interpolation**, no smoothed curves that bury spikes).
6. **Uncertainty stays visible** — Confidence levels (`low` | `medium` | `high`) on trend summaries flag sparse polling. Highlights and warnings call out insufficient data and muted review activity.

## What operators should infer

| Layer | Safe inference | Unsafe inference |
|-------|----------------|------------------|
| Policy findings | Something in signals matches a rule today | Root cause without investigation |
| Action Bridge | Where to look next | That visiting the URL fixed production |
| Review history | Someone recorded intent / triage step | That the finding is objectively “fixed” |
| Trends | Recent half differs from earlier half on stored snapshots | That a specific playbook change caused it |

## Weekly review cadence

1. Read **current findings** first.  
2. Use **actions** only as routed navigation + resolution copy.  
3. Use **history/reviews** for operator memory and recurrence.  
4. Use **trends** only as a **cadence / drift** signal together with **confidence** and **warnings**.

Related: [`growth-policy-action-bridge.md`](./growth-policy-action-bridge.md), [`growth-policy-review-history.md`](./growth-policy-review-history.md), [`growth-policy-trends.md`](./growth-policy-trends.md).

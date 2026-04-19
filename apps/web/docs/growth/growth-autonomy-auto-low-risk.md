# Growth autonomy — controlled low-risk auto-execution (Phase 1)

## What runs automatically (this phase only)

Allowlisted actions create **internal operator artifacts** stored in `growth_autonomy_low_risk_executions` via the execution engine:

- Internal review / follow-up task stubs  
- Internal content draft placeholders  
- Internal follow-up reminder queue entries  
- Internal priority tags / flags  
- Simulation context prefills (stored payload only — no external publish)

Every auto-run writes an **audit row** with deterministic explanation copy. Operators can **undo** supported rows (soft reversal via `reversedAt`).

## What never runs automatically here

- Payments, billing, wallets  
- Booking core or checkout mutations  
- Ads execution core  
- CRO experiments / core rendering mutations  
- Live pricing or monetization knobs  
- External broker/customer messaging auto-send  
- Listing publication / lifecycle writes  
- Anything irreversible without human review  

Those paths stay **`blocked`**, **`approval_required`**, or **`suggest_only`** per policy regardless of autonomy mode.

## Eligibility (must all be satisfied)

Server-side promotion to **`resolvedExecutionClass: auto_low_risk`** requires:

1. **`FEATURE_GROWTH_AUTONOMY_AUTO_LOW_RISK_V1`**  
2. **`FEATURE_GROWTH_AUTONOMY_AUTO_LOW_RISK_ROLLOUT`** not `off`, and base autonomy rollout not `off`  
3. **`FEATURE_GROWTH_AUTONOMY_KILL_SWITCH`** **unset**  
4. Autonomy mode **`SAFE_AUTOPILOT`** (ASSIST stays suggest/prefill only)  
5. Catalog row on **`GROWTH_AUTONOMY_AUTO_LOW_RISK_ALLOWLIST`**  
6. Policy **`allow`** on target (no block/freeze/approval_required)  
7. Confidence ≥ **`GROWTH_AUTONOMY_AUTO_LOW_RISK_MIN_CONFIDENCE`**  
8. Enforcement snapshot **complete** (`inputCompleteness` not `partial`)  
9. Learning loop **not** suppressing category; feedback not strongly negative  
10. Learning aggregates **not sparse** (`insufficient_data`) for escalating to auto — otherwise execution metadata **downgrades**  
11. Viewer cohort bucket **`auto_low_risk`** and pilot gate (internal/partial/full use `computeLowRiskAutoViewerGate`)

If any gate fails → **`prefilled_only`** or **`suggest_only`** with deterministic **downgrade explanation**.

## Monitoring & audit

- Logs: **`[growth:autonomy:execution]`** prefix (never throws).  
- DB audit: table **`growth_autonomy_low_risk_executions`**.  
- GET **`/api/growth/autonomy/auto-execute`** — recent rows for current operator.

## Undo workflow

POST **`/api/growth/autonomy/auto-execute/undo`** with `{ "auditId": "<id>" }` marks `reversedAt`. Internal payloads remain internal-only state — undo is logical/archive for trust.

## Known limitations

- Does not prove causal lift — correlation only.  
- Dedupe window prevents spam per catalog id per operator (`GROWTH_AUTONOMY_AUTO_LOW_RISK_DEDUPE_HOURS`).  
- Partial cohort split is deterministic per user id — not personalized treatment assignment beyond buckets.

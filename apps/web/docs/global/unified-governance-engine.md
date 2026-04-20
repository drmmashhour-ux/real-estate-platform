# Unified Governance Engine v1

## Why this exists

Marketplace autonomy touches **region policy**, **approval boundaries**, **legal posture**, **fraud / revenue stress**, and **execution readiness**. The unified engine produces **one deterministic decision object** so preview APIs, controlled execution, dashboards, and audit pipelines share the same semantics instead of divergent ad hoc checks.

## Deterministic first

Scoring is fully reproducible from inputs. Optional ML scores **only add a bounded bonus** to the combined index and **never override** hard blocks or Syria approval-boundary rules.

## Preview vs execution

| Risk / policy posture | Preview disposition | Execution disposition |
| --- | --- | --- |
| Region blocked | `BLOCKED_FOR_REGION` | `REJECTED` |
| Syria live execution blocked | — | `REJECTED` |
| Legal or fraud hard block | `REQUIRES_LOCAL_APPROVAL` | `REJECTED` |
| Policy requires local approval | `REQUIRES_LOCAL_APPROVAL` | `REQUIRE_APPROVAL` |
| Policy caution | `CAUTION_PREVIEW` | `DRY_RUN` |
| Combined HIGH/CRITICAL | `REQUIRES_LOCAL_APPROVAL` | `REQUIRE_APPROVAL` |
| Combined MEDIUM | `CAUTION_PREVIEW` | `DRY_RUN` |
| Combined LOW | `ALLOW_PREVIEW` | `RECOMMEND_ONLY` |

`AUTO_EXECUTE` appears **only** in execution mode when combined risk is **LOW**, Syria is **not** in scope, no hard blocks, no approval requirement from legal/fraud layers, and auto-execution is enabled via configuration (`AUTONOMY_GOVERNANCE_AUTO_EXECUTE`).

## Fusion formula

Combined score:

`round(min(100, legal * 0.5 + fraud * 0.5 + mlBonus))`

- `mlBonus = 0` when ML adapter is unavailable.
- When available: `mlBonus = 15 * mlScore` (mlScore on \[0,1\]).

Levels: LOW &lt; 25, MEDIUM &lt; 50, HIGH &lt; 75, CRITICAL ≥ 75.

## Syria preservation

Syria continues to flow through `evaluateSyriaPreviewPolicyFromSignals` and `evaluateSyriaApprovalBoundary`. Existing Syria preview fields remain on API responses; unified results are **additive**.

## Audit trace

`trace` is an ordered list of `{ step, ruleId, matched, outcome?, reason? }` entries covering region policy, approval boundary (when Syria), legal risk, fraud/revenue risk, hybrid ML, and combined risk.

## Dashboard semantics

- **Admin slice**: disposition, block flags, risk levels, revenue-at-risk estimate, deduped reasons (max five), trace count, alert severity.
- **Investor slice**: posture labels, protection status, revenue at risk, anomaly level proxy (combined risk tier), human oversight hint, short narrative without rule codes.

## Failure behavior

The evaluator **never throws** to callers. Unexpected failures return a conservative fallback result with `trace` marking `fallback`.

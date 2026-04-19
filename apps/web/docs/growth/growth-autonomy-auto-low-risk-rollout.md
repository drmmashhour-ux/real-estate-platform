# Rollout — low-risk autonomy auto-execution

## Flags

| Env | Role |
|-----|------|
| `FEATURE_GROWTH_AUTONOMY_AUTO_LOW_RISK_V1` | Master switch for server-side allowlisted execution |
| `FEATURE_GROWTH_AUTONOMY_AUTO_LOW_RISK_PANEL_V1` | Dashboard panel + log visibility |
| `FEATURE_GROWTH_AUTONOMY_AUTO_LOW_RISK_ROLLOUT` | `off` (default) · `internal` · `partial` · `full` |

Independently tunable from:

- `FEATURE_GROWTH_AUTONOMY_V1` (base autonomy)  
- `FEATURE_GROWTH_AUTONOMY_LEARNING_V1` (learning loop)  
- `FEATURE_GROWTH_POLICY_ENFORCEMENT_V1` (policy layer)  

## Recommended stages

1. **`off`** — default in production until reviewed.  
2. **`internal`** — enable auto flag + rollout internal; only pilot viewers (`computeLowRiskAutoViewerGate`) in production; cohort hash still assigns `control` / `suggest_only` / `auto_low_risk` for measurement.  
3. **`partial`** — widen snapshot delivery first; keep auto-low-risk internal gate until metrics stable.  
4. **`full`** — still requires pilot eligibility in production unless you explicitly relax internal-access rules elsewhere.

## Kill switch

If **`FEATURE_GROWTH_AUTONOMY_KILL_SWITCH`** is set:

- No POST batch execution — execution engine returns blocked.  
- GET log may still work for audit (read-only).  
- Snapshot enrichment shows **downgraded** execution classes (no server writes).

## Auditing decisions

1. Tail logs for `[growth:autonomy:execution]`.  
2. Query `growth_autonomy_low_risk_executions` by `operator_user_id` / `catalog_entry_id`.  
3. Cross-check snapshot JSON (`suggestions[].execution`) for **holdReasons** on any downgrade.

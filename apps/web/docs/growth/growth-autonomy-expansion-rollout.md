# Rollout — evidence-based expansion governance

## Defaults

- Keep **`FEATURE_GROWTH_AUTONOMY_EXPANSION_V1`** and **`FEATURE_GROWTH_AUTONOMY_EXPANSION_PANEL_V1`** **off** until audit volume exists.
- Enable **panel only** first to read evidence without implying rollout widened.

## Stages

1. **Observe** — low-risk auto-execution producing audit rows; learning aggregates populated.
2. **Evaluate** — turn on **`FEATURE_GROWTH_AUTONOMY_EXPANSION_V1`**; review parent outcomes and candidates in API/dashboard.
3. **Approve sparingly** — admin-only POST approvals for **`eligible_for_trial`** rows only.
4. **Freeze on incident** — set **`FEATURE_GROWTH_AUTONOMY_EXPANSION_FREEZE=1`** or toggle stored freeze in panel.

## Monitoring

Tail **`[growth:autonomy:expansion]`** logs for evaluation counts, insufficient-data rates, and audit blocks.

## Honest limits

- This framework **does not** automatically change the runtime allowlist or execution engine mapping; it records **governance decisions** and surfaces evidence.
- Wiring an approved trial into live auto-execution remains a **separate, explicit code + config change** behind review.

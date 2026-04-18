# Growth autonomy system (V1)

## Purpose

A **coherent orchestration layer** that sits **above** existing Growth Machine panels and **policy enforcement**:

- Makes **OFF / ASSIST / SAFE_AUTOPILOT** explicit.
- Surfaces **bounded**, **inspectable** suggestions with **deterministic explanations** — no vague “AI” prose.
- **Never** executes payments, booking core, ads core, CRO core, unsafe outbound messaging, or risky live mutations.

Autonomy **does not replace** the Growth Policy Enforcement Layer; it **consumes** enforcement snapshots where available and reduces confidence when enforcement is off or inputs are partial.

## Modes (`FEATURE_GROWTH_AUTONOMY_MODE`)

| Mode | Behavior |
|------|-----------|
| **OFF** | Non-critical catalog rows are **hidden** so autonomy stays quiet — but **policy block, freeze, and approval-required** targets **remain visible** as `blocked` / `approval_required` so operators are never blind to enforcement posture. Debug surfacing uses `surfaceDebug`. |
| **ASSIST** | Shows **suggestions only** (`suggest_only`) plus review/approval states — **no automatic execution**. |
| **SAFE_AUTOPILOT** | Allows **bounded prefilled operator actions**: navigation/query links and copy-to-clipboard text **only**. Still **no** risky execution. Prefills appear when enforcement allows (`allow`; `advisory_only` stays suggestion-only except where catalog maps to safer promotion paths — see orchestrator code). |

## Bounded catalog

Action types implemented in code (`growth-autonomy-catalog.ts`):

- `suggest_strategy_promotion`
- `suggest_content_improvement`
- `suggest_messaging_assist`
- `suggest_fusion_review`
- `suggest_simulation_followup`
- `prefill_operator_action`
- `request_manual_review`

Each catalog row maps to **one existing** enforcement target (`GrowthEnforcementTarget`). **No new enforcement domains** are introduced in V1.

## Relationship to policy enforcement

1. When `FEATURE_GROWTH_POLICY_ENFORCEMENT_V1` is **on**, the orchestrator loads `buildGrowthPolicyEnforcementSnapshot()` and resolves each row against the corresponding target.
2. When enforcement is **off**, rows use a **fallback advisory-only** rationale — UI and operator notes explain **reduced guardrails**.
3. When the snapshot is **partial** (`inputCompleteness === "partial"`), autonomy notes uncertainty and lowers confidence hints.

## APIs

| Endpoint | Purpose |
|---------|---------|
| `GET /api/growth/autonomy?locale=&country=` | Builds **GrowthAutonomySnapshot** (requires Growth Machine actor). Optional `growthAutonomyDebug=1` adds operational monitoring (see rollout doc). |

## Monitoring

In-process counters in `growth-autonomy-monitoring.service.ts`: snapshots built, surfaced/blocked/review totals, partial cases. **Never throws.**

## Debugging

- Non-production builds: debug-friendly surfacing defaults for enforcement-off mode visibility in orchestrator inputs (API-controlled).
- Production: use `NEXT_PUBLIC_GROWTH_AUTONOMY_DEBUG`, `NEXT_PUBLIC_GROWTH_AUTONOMY_INTERNAL_UI`, or query `growthAutonomyDebug=1`.

## Limits (honest)

- **Suggest / prefill only** — operators apply changes manually.
- **Monitoring is in-memory** — resets on deploy.
- **Internal rollout stage** restricts production snapshot delivery for non-admins unless bypass env/query is used.

See **rollout**: [`growth-autonomy-rollout.md`](./growth-autonomy-rollout.md).

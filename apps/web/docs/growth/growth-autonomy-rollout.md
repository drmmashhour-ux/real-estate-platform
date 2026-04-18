# Growth autonomy — rollout

Practical rollout guide for **`FEATURE_GROWTH_AUTONOMY_*`** alongside existing growth and enforcement flags.

## Feature flags

| Env | Meaning |
|-----|---------|
| `FEATURE_GROWTH_MACHINE_V1` | Prerequisite for Growth dashboard and `requireGrowthMachineActor`. |
| `FEATURE_GROWTH_AUTONOMY_V1` | Master switch — enables orchestrator + `/api/growth/autonomy`. |
| `FEATURE_GROWTH_AUTONOMY_PANEL_V1` | Shows **Growth autonomy** panel on Growth Machine dashboard. |
| `FEATURE_GROWTH_AUTONOMY_KILL_SWITCH` | **Emergency off** — suppresses autonomy surfaces; base dashboard unchanged. |
| `FEATURE_GROWTH_AUTONOMY_MODE` | `OFF` \| `ASSIST` \| `SAFE_AUTOPILOT` |
| `FEATURE_GROWTH_POLICY_ENFORCEMENT_V1` | Recommended before widening autonomy in production — provides policy gates for catalog targets. |

### Optional debug / staging

| Env | Meaning |
|-----|---------|
| `NEXT_PUBLIC_GROWTH_AUTONOMY_DEBUG` | Attach debug expectations in production tooling; pair with `?growthAutonomyDebug=1` on API. |
| `NEXT_PUBLIC_GROWTH_AUTONOMY_INTERNAL_UI` | Bypass **internal** rollout visibility gate in production for staged QA (non-admin visibility). |

## Rollout stages (`FEATURE_GROWTH_AUTONOMY_ROLLOUT`)

| Stage | Intended use |
|-------|----------------|
| `off` | Autonomy orchestrator disabled at snapshot layer (unless `FEATURE_GROWTH_AUTONOMY_ROLLOUT` parsed as off — autonomy v1 alone does not imply rollout). Combined with autonomy v1: orchestrator returns **disabled** snapshot before catalog build. |
| `internal` | Production **non-admin** users receive **gate message** instead of snapshot (unless bypass env/query). Admins load full snapshot. Dev/staging unaffected by internal gate (`NODE_ENV !== production`). |
| `partial` | Broad operator visibility — full snapshot for authenticated Growth Machine actors (subject to kill switch + flags). |
| `full` | Same as partial for V1 — reserved for future expansion (broader prefills remain **manual** until explicitly designed). |

## Kill switch behavior

When `FEATURE_GROWTH_AUTONOMY_KILL_SWITCH=true`:

- API returns `{ autonomyLayerEnabled: false, killSwitchActive: true, snapshot: null }`.
- Panel shows **explicit suppression message** when panel flag expects UI.

No changes to Stripe, bookings, ads execution, or CRO core through this mechanism.

## Manual QA checklist

1. **Autonomy off (`FEATURE_GROWTH_AUTONOMY_V1=false`)** — Operator sees clear “layer off” panel copy; no empty silence.
2. **Kill switch on** — Same suppression message; `/api/growth/autonomy` returns kill payload.
3. **Enforcement off, autonomy on** — Snapshot builds with advisory fallback; UI warns **reduced guardrails**.
4. **Partial enforcement inputs** — Banner / notes reference partial state; explanations stay deterministic.
5. **Modes** — Rotate `FEATURE_GROWTH_AUTONOMY_MODE`: OFF hides catalog rows from normal visibility; ASSIST surfaces suggestions; SAFE_AUTOPILOT yields **prefill** rows where enforcement allows.
6. **Internal rollout** — As non-admin in prod with `ROLLOUT=internal`, expect gate message and optional monitoring with `growthAutonomyDebug=1`.

## Monitoring / logs

Console prefix: **`[growth:autonomy]`** on snapshot builds (surfaced/blocked/review/hidden counts, partial flag).

Operational monitoring payload (optional on debug/non-prod requests) aggregates in-process counters — **not** an SLA or billing metric.

## Known limitations

- Does **not** integrate new external providers or send channels.
- Prefills are **URLs and copy text** — operators trigger navigation and paste; no webhook execution.

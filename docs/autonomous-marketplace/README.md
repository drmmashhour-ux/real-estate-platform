# Autonomous Marketplace V1

## Purpose

Internal **signals → opportunities → policy → governance → execution** pipeline for marketplace growth actions across FSBO listings, CRM leads, and ads campaign rows. Default posture is **advisory and dry-run**; live mutations are tightly gated.

## Architecture (four layers)

1. **Signals / observation** — `signals/signal-normalizer.ts`, `signals/observation-builder.ts` normalize DB reads into `MarketplaceSignal` + `ObservationSnapshot`.
2. **Growth intelligence** — `detectors/*` + `detectors/detector-registry.ts` emit `Opportunity` + `ProposedAction`.
3. **Constraints / policy** — `policy/policy-engine.ts` + `policy/rules/*` produce `PolicyDecision`.
4. **Execution** — `governance/governance-resolver.ts` chooses dry-run vs execute; `execution/executors/*` perform bounded side effects (tasks, risk alerts) when allowed.

### Text flow

```
Target id → load observation → run detectors → dedupe actions
→ per action: buildPolicyContext → evaluateActionPolicy → resolveGovernance
→ dispatch executor → persist AutonomousMarketplaceRun (+ actions, policy rows, outcome)
```

## Autonomy modes (`AutonomyMode`)

| Mode | Behavior |
|------|-----------|
| `OFF` | No execution; preview/dry outputs only. |
| `ASSIST` | Executes **internal-safe** types (`CREATE_TASK`, `FLAG_REVIEW`, `REQUEST_HUMAN_APPROVAL`) when policy `ALLOW` and env toggles permit. |
| `SAFE_AUTOPILOT` | May execute when policy allows, toggles on, not dry-run. |
| `FULL_AUTOPILOT_APPROVAL` | V1 still routes execution behind human approval for external-impact paths. |

## Safety model

- **Pricing apply** never mutates list price in V1 executor — use seller workflows.
- **Outbound lead messages** are never auto-sent — `SEND_LEAD_FOLLOWUP` creates `LeadTask` rows when execution is allowed.
- **Promotions / campaign budget** remain advisory — no Ads API writes.
- **Compliance-sensitive** action types require elevated mode + policy pass.

## Action lifecycle

`ProposedAction` → `PolicyDecision` → `GovernanceResolution` → `ExecutionResult` → persisted on `AutonomousMarketplaceAction`.

## Feature flags & config

- `FEATURE_AUTONOMOUS_MARKETPLACE_V1` — master gate (see `engineFlags.autonomousMarketplaceV1`).
- `AUTONOMY_ENGINE_ENABLED` — secondary kill switch (default true).
- Thresholds: `AUTONOMY_*` env vars in `config/autonomy.config.ts`.

## Internal APIs (admin-only)

Requires `PlatformRole.ADMIN` via `requireAdminSession`:

| Route | Purpose |
|-------|---------|
| `POST /api/autonomy/preview` | Defaults `dryRun: true` unless overridden |
| `POST /api/autonomy/run` | Generic runner (`targetType` + `targetId`) |
| `POST /api/autonomy/run/listing` | FSBO listing |
| `POST /api/autonomy/run/lead` | CRM lead |
| `POST /api/autonomy/run/scheduled` | Placeholder scan summary |

## Local preview (no writes to production logic beyond audit tables)

```bash
cd apps/web
FEATURE_AUTONOMOUS_MARKETPLACE_V1=true pnpm dev
```

Then POST JSON to `/api/autonomy/preview` with a known listing id.

## Persistence

Prisma models: `AutonomousMarketplaceRun`, `AutonomousMarketplaceAction`, `AutonomousMarketplacePolicyRecord`, `AutonomousMarketplaceOutcomeRecord`.

## Validation

```bash
cd apps/web && pnpm exec prisma validate --schema=./prisma/schema.prisma
cd apps/web && pnpm exec vitest run modules/autonomous-marketplace/__tests__
```

## Extending

- **Detector**: add file under `detectors/`, register in `detector-registry.ts`.
- **Policy rule**: add under `policy/rules/`, wire in `policy/all-rules.ts`.
- **Executor**: extend `execution/executors/*` and `dispatchExecution` in `autonomous-marketplace.engine.ts`.

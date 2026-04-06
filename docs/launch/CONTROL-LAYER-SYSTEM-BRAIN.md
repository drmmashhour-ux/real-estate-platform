# Control layer & system brain

## What this is (and is not)

- **Is:** Policy for **how much** automation is allowed, and **orchestrated recommendations** from failure signals (E2E, future ops webhooks).
- **Is not:** Auto-changing production, moving money, sending legal/dispute messages, or running refunds without a human in the loop.

That intentional gap is the **safe stage** before any “full autonomy” narrative.

## Autonomy modes (`AutonomyMode`)

Defined in `apps/web/lib/system-brain/autonomy-modes.ts`:

| Mode | Behavior |
|------|----------|
| `OFF` | No AI-driven actions (aligns with orchestrator `globalMode === "OFF"`). |
| `ASSIST` | Suggestions only — no automatic side-effects. |
| `SAFE_AUTOPILOT` | Auto **only** for explicitly low-risk intents (e.g. `low_risk_internal`). |
| `FULL_WITH_APPROVAL` | More automation in principle, but **mandatory-approval categories** still require a human gate. |

### Mapping to existing DB settings

`ManagerAiPlatformSettings.globalMode` uses `AutopilotMode`. Use:

- `autonomyModeToAutopilot()` / `autopilotToAutonomyMode()` to translate without breaking stored values.

## Levels 2 → 5 (documentation)

See `lib/system-brain/levels.ts`:

- **L2** — Assisted intelligence (`ASSIST`)
- **L3** — Safe autopilot — `rule-engine.ts` + `evaluateAutonomousStep` in `autonomy-controller.ts`
- **L4** — Controlled autonomy — medium-risk actions use `lib/approvals/` (`MarketplaceAutonomyApproval`)
- **L5** — Full marketplace autonomy **with hard guardrails** — `safety-guardrails.ts` blocks money/dispute/legal primitives forever

## Mandatory human approval (`ALWAYS_REQUIRES_APPROVAL`)

`apps/web/lib/system-brain/risk-evaluator.ts` lists categories that **never** auto-execute, including:

- Payments, refunds, payouts  
- Booking confirmation overrides, money-affecting cancellations  
- Manual payment settlement  
- Legal / dispute outbound  
- External user messaging  
- Trust & safety enforcement, pricing/fee changes  

**Pricing:** `lib/revenue/pricing-engine.ts` only **suggests**; applying a price is `pricing_or_fee_change` → approval queue.

## System brain modules

| File | Role |
|------|------|
| `decision-engine.ts` | `decideFromFailureSignal`, `decideFromMarketplaceMetrics` |
| `risk-evaluator.ts` | Approval sets, `evaluateActionKindRisk` |
| `action-router.ts` | `routeSideEffect(mode, intent)` |
| `rule-engine.ts` | L3 low-risk auto eligibility |
| `autonomy-controller.ts` | Guardrails + router + rule engine |
| `safety-guardrails.ts` | Forbidden primitives (never auto) |
| `failure-signals.ts` | `BrainFailureSignal` union |

## Approval queue (Level 4)

- Prisma: `MarketplaceAutonomyApproval` (`pending` → `approved` | `rejected` → `executed`)
- Service: `apps/web/lib/approvals/service.ts`

Run migration after schema pull: `pnpm exec prisma migrate dev` (from `apps/web`).

## Wiring today

- E2E failure pipeline calls `decideFromFailureSignal` and logs brain fields via `logOpsCorrelation`.

## Related docs

- [GROWTH-PLAN-10K.md](./GROWTH-PLAN-10K.md)
- [PRODUCTION-MONITORING.md](./PRODUCTION-MONITORING.md)
- [INCIDENT-RESPONSE.md](./INCIDENT-RESPONSE.md)

## Tests

- `apps/web/tests/system-brain/brain.test.ts`
- `apps/web/tests/revenue/pricing-engine.test.ts`
- `apps/web/tests/ranking/ranking-engine.test.ts`

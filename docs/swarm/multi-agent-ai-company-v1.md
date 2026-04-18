# Multi-agent AI Company (Swarm) V1

## Purpose

An **additive** multi-agent layer that runs **specialized read-only agents** (Ads, CRO, Brain, Operator, Platform Core, Strategy, Market Intel, Content) in parallel, then **scores**, **negotiates**, and emits a **unified advisory decision bundle**. It **does not** replace Brain, Ads, CRO, Operator, Platform Core, Fusion, or Autonomous Company Mode — it **coordinates** proposals above them.

## Agents and roles

| Agent | Role | Reads |
|-------|------|--------|
| Ads | performance | Ads V8 monitoring snapshot |
| CRO | conversion | CRO V8 optimization bundle (when analysis flag on) |
| Brain | intelligence | Brain V8 shadow monitoring |
| Operator | execution | Assistant recommendations (read-only list) |
| Platform Core | orchestration | Recent decisions (read-only) |
| Strategy | strategy | Autonomous company + Fusion context when present |
| Market Intel | market | Market intelligence stub (extendable) |
| Content | content | Content growth drafts (draft-only) |

## Orchestration flow

1. `runSwarmCycle()` (in `swarm-orchestrator.service.ts`) exits immediately if `FEATURE_SWARM_SYSTEM_V1` is off.
2. Builds `SwarmAgentInput` with optional `runAutonomousCompanyCycle` + `buildFusionPrimarySurface` snapshots (never mutates them).
3. Runs all eight agents sequentially in-process (parallel fan-out can be added later).
4. Flattens proposals → `detectSwarmConflicts` → `negotiateProposals` (if `FEATURE_SWARM_AGENT_NEGOTIATION_V1`) → `computeSwarmAggregateScores` → `buildSwarmDecisionBundle`.
5. `buildSwarmHealthSummary` adds observational warnings.

## Negotiation model

`swarm-negotiation.service.ts` classifies each proposal into: `proceed`, `proceed_with_caution`, `monitor_only`, `defer`, `blocked`, `require_human_review`. Cross-agent conflicts (e.g. scale vs caution, execute vs blocked) are **detected** and influence status — **no execution**.

## Scoring model

`swarm-scoring.service.ts` computes bounded aggregates (`swarmConfidence`, `swarmPriority`, `swarmRisk`, `swarmReadiness`, `agreementScore`, `evidenceScore`, `executionSuitability`) from proposal fields only — **does not** alter Brain or Operator weights.

## Decision bundle structure

See `SwarmDecisionBundle` in `apps/web/modules/swarm/swarm-system.types.ts`: `opportunities`, `groupedBy` (proceed / caution / monitor / defer / blocked / `human_review`), `conflicts`, `negotiationResults`, `scores`, `meta` (agents run, agreement, conflicts, evidence, readiness, `primarySurface`, `influenceApplied`).

## Flags

| Env | Code | Default |
|-----|------|---------|
| `FEATURE_SWARM_SYSTEM_V1` | `swarmSystemFlags.swarmSystemV1` | off |
| `FEATURE_SWARM_AGENT_NEGOTIATION_V1` | `swarmAgentNegotiationV1` | off |
| `FEATURE_SWARM_AGENT_PERSISTENCE_V1` | `swarmAgentPersistenceV1` | off |
| `FEATURE_SWARM_AGENT_INFLUENCE_V1` | `swarmAgentInfluenceV1` | off |
| `FEATURE_SWARM_AGENT_PRIMARY_V1` | `swarmAgentPrimaryV1` | off |

## Observability

- `[swarm:v1]` — cycle lifecycle, proposal/conflict counts.
- `[swarm:v1:negotiation]` — negotiation outcome summary.
- `[swarm:v1:persistence]` — stub log when persistence flag is on (no DB writes in this revision).

## Rollback

Set all `FEATURE_SWARM_*` to `0` or unset — no swarm code paths execute; existing product behavior unchanged.

## What swarm does NOT do

- Auto-execute campaigns, budgets, Platform tasks, or payments  
- Overwrite trust, weights, outcomes, or financial records  
- Replace Fusion or Autonomous Company orchestration (optional inputs only)

## Validation commands

```bash
cd apps/web
pnpm exec vitest run modules/swarm/
```

Full-repo `tsc` may require high memory in large workspaces.

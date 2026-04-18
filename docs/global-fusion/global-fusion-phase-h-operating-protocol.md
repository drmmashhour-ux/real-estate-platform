# Global Fusion Phase H — Company operating protocol

## Purpose

Phase H defines a **structured coordination contract** (not execution) between Global Fusion (executive + primary advisory), Swarm, Global Growth Loop, Operator V2, Platform Core, and Company Command Centers. It **distributes priorities and signals**, highlights **alignment and tensions**, and keeps each subsystem **autonomous**.

## Systems involved

| Notional consumer | Role in protocol |
|-------------------|------------------|
| **Swarm** | High-level objectives + coordination signals |
| **Growth Loop** | Growth priorities, funnel focus, scaling vs optimization hints |
| **Operator** | Readiness, dependency-style blockers, constraints |
| **Platform Core** | Health/governance/technical risk signals |
| **Command Center** | Presentation-oriented grouped priorities and risks |

Consumption is **optional** and **read-only**; nothing forces downstream systems to obey protocol output.

## Protocol structure

`buildGlobalFusionOperatingProtocol()` produces:

- **priorities** — protocol-level priority rows with target systems
- **risks / opportunities / blockers** — subsets of **signals** filtered by `type`
- **directives** — **advisory** coordination suggestions (not commands)
- **alignment** — positive coordination hints
- **conflicts** — protocol-level **coordination tensions** (distinct from Fusion snapshot `GlobalFusionConflict`)
- **signals** — canonical cross-system messages (`priority` | `risk` | `opportunity` | `blocker` | `alignment`)
- **meta** — version, governance decision echo, notes

Inputs are assembled from the same Fusion context as Phase G (primary payload, monitoring, governance, learning, freeze) via `buildGlobalFusionExecutiveSummaryFromAssembly`.

## Directives vs signals

- **Signals** describe *what Fusion observes* and which **target systems** should be aware (for routing/UI).
- **Directives** are *explicit advisory coordination suggestions* (e.g. governance sync, funnel stabilization) with **constraints** and **provenance**. They do **not** override subsystem decisions or trigger execution.

## Alignment / conflict model

`global-fusion-protocol-alignment.service.ts` derives **alignment** rows and **protocol conflicts** from executive posture + assembly (e.g. growth push vs operator blocked, ranking expansion vs governance caution). Outputs are **heuristic and observational**.

## Feed contract

`buildGlobalFusionProtocolFeed()` returns `null` when `FEATURE_GLOBAL_FUSION_PROTOCOL_FEED_V1` is off. When on, it returns `protocol`, **`perSystem`** slices (swarm, growth_loop, operator, platform_core, command_center), and **meta** (flags, warnings). Shape is **stable** and **partial-data tolerant**.

## Observability / logging

Namespace: **`[global:fusion:protocol]`**. When `FEATURE_GLOBAL_FUSION_PROTOCOL_MONITORING_V1` is on, `recordProtocolBuild` updates counters and emits structured logs (builds, signal/directive/conflict counts, per-system distribution, observational warnings).

## Optional persistence

Process-local **ring buffer** of protocol snapshots when `FEATURE_GLOBAL_FUSION_PROTOCOL_FEED_V1` is on (`global-fusion-protocol-persistence.service.ts`). No Prisma / no coupling to source-truth tables.

## Rollback / disable steps

1. Set `FEATURE_GLOBAL_FUSION_PROTOCOL_V1=0` (and optionally `FEATURE_GLOBAL_FUSION_PROTOCOL_FEED_V1=0`, `FEATURE_GLOBAL_FUSION_PROTOCOL_MONITORING_V1=0`).
2. Redeploy or restart so environment is applied.
3. Downstream systems stop reading feeds; no data migration required.

## Validation commands

```bash
cd apps/web && pnpm exec vitest run modules/global-fusion/global-fusion-protocol.service.test.ts
cd apps/web && pnpm exec vitest run modules/global-fusion/global-fusion-protocol-alignment.test.ts
cd apps/web && pnpm exec vitest run modules/global-fusion/protocol-mappers.test.ts
cd apps/web && pnpm exec vitest run modules/global-fusion/global-fusion-protocol-feed.test.ts
cd apps/web && pnpm exec vitest run modules/global-fusion/global-fusion-protocol-monitoring.test.ts
cd apps/web && pnpm exec vitest run modules/global-fusion
```

---

**Explicit:** The operating protocol is **advisory only**. **Systems remain autonomous.** There is **no execution override** and **no mutation of stored source-system truth**.

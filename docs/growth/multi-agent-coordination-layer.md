# Multi-Agent Coordination Layer

## Purpose

An **advisory orchestration** surface where specialized growth agents each emit **typed proposals** from existing read-only signals. A coordinator:

- Merges proposals  
- Optionally detects **conflicts** and **alignments** (feature-gated)  
- Resolves a **top-5 priority list** for human review  

No new execution, no outbound messaging, no payments/bookings/ads-core/CRO-core mutations.

## Agent roles

| Agent | Source |
|--------|--------|
| `ads_agent` | UTM / `computePaidFunnelAdsInsights` |
| `cro_agent` | Fusion CRO bucket + conversion themes |
| `leads_agent` | CRM counts + follow-up queue sample |
| `messaging_agent` | Messaging assist flag + follow-up pressure |
| `content_agent` | Content assist flag + ads opportunity pairing |
| `governance_agent` | `evaluateGrowthGovernance` |
| `fusion_agent` | `prioritizeGrowthFusionActions` |

## Coordination flow

1. `buildAgentCoordinationContext()` loads shared snapshots (early conversion, governance optional, fusion optional, CRM follow-up).  
2. Each `build*AgentProposals(ctx)` returns bounded proposals.  
3. `detectGrowthAgentConflicts` / `detectGrowthAgentAlignments` (if flags on).  
4. `resolveGrowthAgentPriorities` orders top five with conflict penalties and alignment boosts.  
5. `recordGrowthAgentCoordination` + `[growth:agents]` logs.

## Conflict model

Deterministic keyword/theme rules (e.g. scale vs conversion-hardening, governance vs growth emphasis). Severity is conservative.

## Alignment model

Groups proposals that share themes (follow-up, campaign+content, governance+fusion caution).

## Priority resolution

Numeric blend of `priorityScore` / impact, minus penalty if a proposal is in a **high**-severity conflict, plus boosts for alignment membership. **No side effects.**

## Safety guarantees

- Recommendations only; **no auto-execution**.  
- **GET `/api/growth/agents/coordination`** exposes JSON for dashboards and optional future autopilot UI consumers — **does not** enqueue executable autopilot actions in this phase.  
- Source systems remain authoritative.

## Feature flags

| Env | Default |
|-----|---------|
| `FEATURE_GROWTH_MULTI_AGENT_V1` | off — coordinator + API + panel |
| `FEATURE_GROWTH_AGENT_CONFLICT_V1` | off — skip conflict detection |
| `FEATURE_GROWTH_AGENT_ALIGNMENT_V1` | off — skip alignment detection |

## Validation

```bash
cd apps/web && npx vitest run modules/growth/__tests__/growth-agent-
```

Run full agent test glob:

```bash
npx vitest run modules/growth/__tests__/ads-agent.service.test.ts modules/growth/__tests__/growth-agent-coordinator.service.test.ts
```

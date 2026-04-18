# Growth Knowledge Graph (V1)

## Purpose

The **Growth Knowledge Graph** is a **read-only, in-memory relationship layer** that connects recurring concepts from the existing growth stack (memory, executive, governance, strategy, simulations, autopilot signals, campaign band) into nodes and edges. It helps operators see **what relates to what** without changing source systems, payments, ads execution, CRO core, or checkout.

- **No graph database** in v1 — the graph is built on demand and discarded.
- **Advisory only** — does not auto-execute, override priorities, or mutate authoritative data.
- **Bounded** — caps on nodes and edges keep work deterministic and safe with partial inputs.

## Node types

| Type | Typical meaning |
|------|-----------------|
| `campaign` | Attributed or top campaign theme |
| `blocker` | Recurring friction (memory / strategy) |
| `winning_pattern` | Repeated positive signal from memory |
| `lesson` | Campaign / follow-up / governance lesson |
| `operator_decision` | Operator preference from memory |
| `recommendation` | Strategy experiment or autopilot suggestion |
| `outcome` | Simulation-style outcome node |
| `priority` | Executive or strategy priority |
| `risk` | Executive or governance risk line |

Sources include: `memory`, `governance`, `strategy`, `executive`, `simulation`, `autopilot`, `manual` (reserved).

## Edge types

| Edge | Use |
|------|-----|
| `causes` | Causal hint (conservative confidence) |
| `relates_to` | Thematic overlap |
| `supports` | One node supports another theme |
| `conflicts_with` | Tension (e.g. governance vs acquisition push) |
| `resulted_in` | Outcome linkage (when used) |
| `reinforces` | Strengthens same narrative |
| `blocks` | Blocks or delays another (e.g. conversion lesson vs scale) |
| `preferred_by_operator` | Operator alignment with a priority |

Every edge carries a **short rationale** (explainable, not opaque).

## Extraction logic

- **Nodes** (`buildGrowthKnowledgeNodes`): deterministic IDs, deduplication by stable hash of type + title, pools capped per subsystem (see `growth-knowledge-graph-nodes.service.ts`).
- **Edges** (`buildGrowthKnowledgeEdges`): rule-based links between node groups (campaign/blocker/win/lesson/operator/priority/risk) plus input hints (e.g. ads band, missing data). No ML.

## Graph summary

`buildGrowthKnowledgeGraph` / `assembleGrowthKnowledgeGraph` produces:

- `nodeCount` / `edgeCount`
- `dominantThemes` — from repeated tags
- `recurringBlockers` — from memory when present, else blocker nodes
- `repeatedWinners` — from memory when present, else winning_pattern nodes

## Query helpers

In `growth-knowledge-graph-query.service.ts`:

- `findKnowledgeNeighbors(nodeId, graph)` — bounded neighbor list
- `findRecurringBlockerCluster` — blocker-type nodes (bounded)
- `findWinningPatternCluster` — winning_pattern nodes (bounded)
- `findConflictingDecisionPairs` — `conflicts_with` edges with endpoints

## Bridge insights

`buildKnowledgeGraphInsights(graph)` returns compact strings for Mission Control notes and (when enabled) the dashboard panel via the API. Gated by **`FEATURE_GROWTH_KNOWLEDGE_GRAPH_BRIDGE_V1`**. Mission Control appends at most **two** lines when graph + bridge flags are on (see `growth-mission-control.service.ts`).

## Feature flags (default off)

| Env | Behavior |
|-----|----------|
| `FEATURE_GROWTH_KNOWLEDGE_GRAPH_V1` | Core graph build + `GET /api/growth/knowledge-graph` |
| `FEATURE_GROWTH_KNOWLEDGE_GRAPH_PANEL_V1` | `GrowthKnowledgeGraphPanel` on Growth Machine dashboard |
| `FEATURE_GROWTH_KNOWLEDGE_GRAPH_BRIDGE_V1` | Bridge insights in API response + Mission Control notes |

Aliases in code: `FEATURE_GROWTH_KNOWLEDGE_GRAPH_*` (see `config/feature-flags.ts`).

## Monitoring

`growth-knowledge-graph-monitoring.service.ts` — counters and `[growth:knowledge-graph]` logs; `getGrowthKnowledgeGraphMonitoringSnapshot()` / `resetGrowthKnowledgeGraphMonitoringForTests()`.

## Safety guarantees

- No Stripe, booking, checkout, or pricing mutations.
- No ads execution or CRO core changes.
- No external messaging.
- Source systems (Prisma, executive builders, etc.) remain authoritative; the graph only **reads** assembled summaries.

## Validation commands

From `apps/web`:

```bash
pnpm exec vitest run modules/growth/__tests__/growth-knowledge-graph
```

Optional full growth module subset:

```bash
pnpm exec vitest run modules/growth/__tests__/growth-knowledge-graph --reporter=dot
```

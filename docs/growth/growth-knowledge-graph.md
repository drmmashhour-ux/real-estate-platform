# Growth Knowledge Graph (V1)

## Purpose

The **Growth Knowledge Graph** is a **read-only, in-memory** relationship layer: it connects campaigns, blockers, lessons, winning patterns, operator decisions, recommendations, outcomes, priorities, and risks derived from existing growth modules (Memory, Executive, Governance, Strategy, Simulations, Autopilot, early conversion snapshot). It supports **advisory reasoning over relationships** — not isolated bullet lists — without a graph database, without mutating source data, and without auto-execution.

## Node types

`GrowthKnowledgeNodeType`: `campaign`, `blocker`, `winning_pattern`, `lesson`, `operator_decision`, `recommendation`, `outcome`, `priority`, `risk`.

Nodes carry `source` (`memory`, `governance`, `strategy`, `executive`, `simulation`, `autopilot`, `manual`) plus optional `confidence` and `tags`.

## Edge types

`GrowthKnowledgeEdgeType`: `causes`, `relates_to`, `supports`, `conflicts_with`, `resulted_in`, `reinforces`, `blocks`, `preferred_by_operator`.

Every edge requires a short **rationale** string (explainable, deterministic heuristics — not opaque ML).

## Extraction logic

- **Nodes** (`buildGrowthKnowledgeNodes`): maps Growth Memory entries, executive priorities/risks/campaign, governance risks, strategy priorities/blockers/experiments, simulation scenarios, autopilot action titles, optional top campaign label, and a weak-band lesson when ads health is weak. Output is **bounded** (caps per pool).

- **Edges** (`buildGrowthKnowledgeEdges`): connects nodes with explicit rules (e.g. conversion lesson `blocks` campaign nodes, governance risk `conflicts_with` scale/acquisition-style priority, operator preference `preferred_by_operator` follow-up priority). **Bounded** edge count.

## Graph summary

`buildGrowthKnowledgeGraph` / `assembleGrowthKnowledgeGraph` fills `summary`: `nodeCount`, `edgeCount`, `dominantThemes` (from tag frequency), `recurringBlockers`, `repeatedWinners` (preferring memory titles when memory is available).

## Query helpers

In `growth-knowledge-graph-query.service.ts`: `findKnowledgeNeighbors`, `findRecurringBlockerCluster`, `findWinningPatternCluster`, `findConflictingDecisionPairs` — all **in-memory**, bounded.

## Bridge insights

`buildKnowledgeGraphInsights(graph)` returns short strings for Mission Control / Executive / Strategy surfaces. When **`FEATURE_GROWTH_KNOWLEDGE_GRAPH_BRIDGE_V1`** is on with the main graph flag, Mission Control may append up to **two** insight lines (advisory only).

## Safety guarantees

- No auto-execution; no Stripe/bookings/checkout/pricing changes.
- No ads execution or CRO core logic changes.
- No external messaging; no writes to authoritative stores from this layer.
- Disable flags to remove influence; source systems remain authoritative.

## Feature flags

| Env | Role |
| --- | --- |
| `FEATURE_GROWTH_KNOWLEDGE_GRAPH_V1` | Master gate — graph build + `GET /api/growth/knowledge-graph` |
| `FEATURE_GROWTH_KNOWLEDGE_GRAPH_PANEL_V1` | Dashboard panel |
| `FEATURE_GROWTH_KNOWLEDGE_GRAPH_BRIDGE_V1` | Optional insight lines on Mission Control (with V1) |

## Validation commands

```bash
cd apps/web && pnpm exec vitest run modules/growth/__tests__/growth-knowledge-graph*.test.ts
```

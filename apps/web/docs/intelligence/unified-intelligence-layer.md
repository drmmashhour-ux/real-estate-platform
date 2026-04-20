# Unified intelligence layer (read model)

## Purpose

The unified intelligence layer presents a **single admin-oriented read model** for a listing: observation, trust, growth, execution, governance, and source-freshness — without duplicating CRM vs regional rows as separate “truths”.

## What it does

- **Prefers canonical data** from `AutonomousMarketplaceRun` / action rows when `FEATURE_AUTONOMOUS_MARKETPLACE_V1` is on.
- Merges **regional listing intelligence** (e.g. web CRM + optional Syria adapter) from `getUnifiedListingIntelligence`.
- Optionally attaches **event timeline counts** when `FEATURE_EVENT_TIMELINE_V1` is on (`buildEntityTimeline`).
- Exposes **JSON APIs**: `GET /api/admin/unified-intelligence/listing`, `GET /api/admin/unified-intelligence/summary`, gated by `FEATURE_UNIFIED_INTELLIGENCE_V1`.

## What it cannot do

- No writes, no outbound automation, **no preview-path execution**.
- No LLM inference or black-box scoring; facets are deterministic service outputs or advisory hints.
- Does not bypass compliance or governance — it **reflects** stored dispositions only.

## Source-of-truth strategy

1. Canonical autonomy tables (runs + actions) when available.
2. Append-only **event timeline** counts (availability only).
3. CRM / regional adapters for listing observation.
4. Explicit `availabilityNotes` when data is partial or ambiguous (e.g. plain id collision across regions).

## Legacy fallback

Legacy or secondary tables are not merged blindly: missing canonical runs yields `canonicalRuns: missing | partial` with explanatory notes rather than synthesized scores.

## Related docs

- `apps/web/docs/autonomous-marketplace/controlled-execution-engine.md`
- `apps/web/docs/dashboard/marketplace-intelligence-dashboard.md`
- `apps/web/docs/market-domination/market-domination-layer.md`

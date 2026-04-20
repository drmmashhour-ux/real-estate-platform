# Global multi-region architecture

## Overview

LECIPM uses a **shared core** (`@lecipm/platform-core`) for region identity, capabilities, and resolution, while **market-specific behavior** stays in app modules and **regional adapters** (e.g. `web-region-adapter`, `syria` read path). This avoids merging unrelated legal and product rules into a single codepath.

## Principles

- **Isolation**: Canada/Québec and Syria keep separate data paths; no schema merge.
- **Adapters**: Each region exposes a read-only adapter that maps local data to **normalized** platform types.
- **Policy packs**: Jurisdiction rules are attached per region (`jurisdiction-policy-pack-registry`), not hard-coded globally.
- **Determinism**: Registries sort by stable keys; helpers avoid throwing.

## Packages

| Piece | Role |
|-------|------|
| `@lecipm/platform-core` | Types, `REGION_REGISTRY`, resolution helpers |
| `apps/web`…`integrations/regions` | Concrete adapters + adapter registry |
| `apps/syria` | Standalone app; shares DB conventions only |

## Future markets

Add a row to `REGION_REGISTRY`, implement an adapter in `apps/web` (or a dedicated app), register it in `region-adapter-registry.ts`, and extend `getJurisdictionPolicyPack` with a new pack.

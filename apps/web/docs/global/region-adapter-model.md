# Region adapter model

## Contract

Regional modules implement listing-oriented reads that return **NormalizedListing** (and optional booking/user shapes) from `@lecipm/platform-core`.

## Registered adapters

- **`ca_qc`** → `web-region-adapter.service.ts` (CRM `Listing` projection; read-only).
- **`sy`** → `syria-region-adapter.service.ts` façade over `syria/` read services.

## Lookup

Use `getRegionAdapter(regionCode)` from `region-adapter-registry.ts`. Unknown codes return `null` — callers attach availability notes instead of failing.

## Why not import `apps/syria` in web?

The Syria **web-side** adapter uses Prisma/raw SQL against `syria_*` tables in the shared database URL, keeping the standalone Syria app runnable without coupling its internal modules.

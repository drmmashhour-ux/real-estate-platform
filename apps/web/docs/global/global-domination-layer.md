# Global domination layer

## Purpose

**Advisory** cross-region signals for expansion prioritization — ranking/pricing variance hints per region, bounded numeric proxies only. No automated rollout.

## API

`GET /api/admin/global-domination` — optional `?slice=expansion|pricing|trust`.

## Service

`apps/web/modules/market-domination/global-market-domination.service.ts` builds summaries from `REGION_REGISTRY`, jurisdiction packs, and optional Syria intelligence snapshot.

## Flag

`FEATURE_GLOBAL_DOMINATION_V1` (default off).

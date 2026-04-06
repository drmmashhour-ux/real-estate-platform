# Rollback plan

1. **Flags**: unset `ENABLE_AI_CONTENT_PUBLISH`, `ENABLE_SYRIA_MARKET`, or use DB feature flags via `/admin/controls` patterns.
2. **Generated content**: `/admin/content` — rollback published rows to approved + restore snapshot.
3. **Autopilot**: platform/host kill switches (existing autonomy config).
4. **Deploy**: revert Git SHA; run `prisma migrate` only if a migration must be rolled back (avoid destructive down in prod—prefer forward fix).

## Growth / manager funnel

5. **Manager events** are append-only in `growth_funnel_events` and `launch_events` (`mgr:*`). Roll back *behavior* by disabling client beacons: stop calling `/api/growth/manager-track` from marketing layout (revert `MarketingPageViewTracker` / `I18nContext` hooks) — no data deletion required.
6. **Stripe**: if checkout misconfigured, disable `onlinePaymentsEnabled` in `PlatformMarketLaunchSettings` and route users through manual-first ops (see Syria runbook) until fixed.


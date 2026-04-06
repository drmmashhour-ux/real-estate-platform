# Production monitoring dashboard

## Where

- **UI:** `/admin/monitoring` (same protection as other admin surfaces: `ADMIN` or `ACCOUNTANT`).
- **API:** `GET /api/admin/monitoring/snapshot?range=today|7d|30d&locale=all|en|fr|ar&market=all|default|syria`

## Metrics sources

| Area | Source |
|------|--------|
| Bookings | Prisma `Booking` (counts, attention sample) |
| Payments / Stripe | Prisma `Payment`, `GrowthStripeWebhookLog` |
| Locales | `growth_funnel_events` JSON `properties->>'locale'` |
| Markets | `platform_market_launch_settings` + `market_mode_used` funnel events |
| AI | `ManagerAiRecommendation`, `ManagerAiApprovalRequest` |
| Notifications | `Notification` |
| Errors | `ErrorEvent` (internal lightweight log when populated) |
| Pre-launch E2E | `e2e/reports/latest-run.json` |

## Launch health score

`lib/monitoring/build-launch-health.ts` assigns **green / yellow / red** per subsystem and a **0–100** score from weighted traffic lights. Thresholds are heuristic; tune constants as volume grows.

## Export

Use **Copy monitoring JSON** on the dashboard to snapshot metrics for incidents or Slack.

## Alerts

Critical/warning banners derive from the same health builder (e.g. high payment failure ratio, error burst, manual settlement backlog).

## Tests

- `apps/web/tests/monitoring/build-launch-health.test.ts`

## Sentry

Not configured in this repo; if you add Sentry, extend `load-monitoring-snapshot` to merge external incident counts without duplicating `ErrorEvent`.

## Related: autonomy & system brain

Policy for what may auto-run vs require human approval lives in `lib/system-brain/` — see [CONTROL-LAYER-SYSTEM-BRAIN.md](./CONTROL-LAYER-SYSTEM-BRAIN.md).

## Related: growth phases

See [GROWTH-PLAN-10K.md](./GROWTH-PLAN-10K.md) for the 0→10k user playbook; pair with `lib/growth/engine.ts` opportunity scans in weekly ops.

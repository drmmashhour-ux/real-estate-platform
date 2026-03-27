# Demo reset and analytics

## Reset

Scheduled or manual demo resets should:

1. Clear demo-scoped rows (or swap to a fresh schema snapshot), preserving non-demo tenants.
2. Invalidate sessions and demo cookies as implemented in `lib/demo-session-cookie.ts` and related helpers.
3. Log the reset for audit (`lib/audit`).

## Analytics

Demo page views and funnel steps are tracked separately from production; see `components/demo/DemoPageViewTracker.tsx` and `app/api/demo/track/*`. Ensure analytics pipelines tag events with `environment=staging` or `demo=true`.

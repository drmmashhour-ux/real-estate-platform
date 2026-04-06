# Launch hardening

## Health and readiness

- **`GET /api/ready`** — deployment readiness (includes DB and environment checks where configured).
- **`GET /api/health`** — lightweight liveness (if present alongside ready).

Feature toggles for locales, Syria-style market, manual bookings/payments, contact-first UX, and AI content are combined from **environment** and **database** launch flags (`resolveLaunchFlags` and related admin UI).

## Checklists and playbooks

| Topic | Doc |
|--------|-----|
| Soft launch | [docs/launch/SOFT-LAUNCH-CHECKLIST.md](./launch/SOFT-LAUNCH-CHECKLIST.md) |
| Booking ops | [docs/launch/BOOKING-OPS-PLAYBOOK.md](./launch/BOOKING-OPS-PLAYBOOK.md) |
| Manual payments | [docs/launch/MANUAL-PAYMENT-OPS.md](./launch/MANUAL-PAYMENT-OPS.md) |
| Rollback | [docs/launch/ROLLBACK-PLAN.md](./launch/ROLLBACK-PLAN.md) |
| Readiness report | [docs/launch/LAUNCH-READINESS-REPORT.md](./launch/LAUNCH-READINESS-REPORT.md) |

## Static feature flags (documentation defaults)

`apps/web/lib/config/flags.ts` documents default intent; runtime behavior still follows `resolveLaunchFlags` and admin settings.

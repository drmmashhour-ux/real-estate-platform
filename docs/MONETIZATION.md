# Investment MVP — monetization (soft limits)

## Plans

| Plan | `User.plan` | Saved deals (account) | Notes |
|------|-------------|------------------------|--------|
| **Free** | `free` (default) | Max **3** | Analyze unlimited; demo/local saves unchanged |
| **Pro** | `pro` | Unlimited | Positioning for advanced insights & comparison messaging |

Upgrade is **mock-only** until Stripe: `/pricing` → “Upgrade to Pro” shows a toast.

## Enforcement

- **POST `/api/investment-deals`**: returns `403` with `code: "INVESTMENT_DEAL_LIMIT"` when Free user already has 3 deals.
- **Demo mode** (`/demo/*`, not logged in): no server-side deal rows; local storage is not capped.

## Tracking (traffic_events)

- `investment_plan_limit_hit` — blocked save (analyze flow).
- `investment_upgrade_click` — any “Upgrade to Pro” / pricing CTA using `UpgradeToProLink` or mock checkout.

## Admin / testing

Set Pro in the database:

```sql
UPDATE "User" SET plan = 'pro' WHERE email = 'you@example.com';
```

Insights dashboard → **Growth & sharing** includes limit hits and upgrade clicks (30d).

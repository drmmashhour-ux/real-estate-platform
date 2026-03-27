# Primary mortgage broker

All mortgage evaluation requests (`POST /api/mortgage/request`) are assigned to **one** trusted broker:

- `MortgageBroker.isPrimary = true`
- `plan = "pro"` (full dashboard + contact access)
- Name, email, and phone come from environment variables and are **synced into the database** whenever a lead is created (so you can change `.env` without a manual migration).

## Environment variables

| Variable | Description |
|----------|-------------|
| `MORTGAGE_PRIMARY_BROKER_NAME` | Display name (default: `Primary Mortgage Partner`) |
| `MORTGAGE_PRIMARY_BROKER_EMAIL` | Broker inbox for notifications and public card |
| `MORTGAGE_PRIMARY_BROKER_PHONE` | Phone shown to clients |
| `MORTGAGE_PRIMARY_BROKER_COMPANY` | Optional company line |
| `BROKER_EMAIL` | Used as **fallback** for email if `MORTGAGE_PRIMARY_BROKER_EMAIL` is unset |

Optional: `RESEND_API_KEY` / `EMAIL_FROM` so `sendEmail` can deliver **“New mortgage lead received”** to the broker.

## Behaviour

1. **Assignment**: Every new `MortgageRequest` gets `brokerId` = primary broker (`ensurePrimaryMortgageBroker()`).
2. **Email**: Best-effort notification via `lib/email/send` (no-op if email not configured).
3. **Broker dashboard**: `/broker/dashboard` lists assigned requests; **Contact Client** reveals borrower email/phone (Pro); **Mark as contacted / approved** updates status.

## Manual workflow

Brokers contact clients **outside** the app (email/phone). No in-app chat is required for this flow.

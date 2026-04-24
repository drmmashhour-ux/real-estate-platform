# BNHub Financial Ledger & Payout System

Non-custodial financial tracking system for BNHub hosts and platform operations.

## Architecture
- **Ledger-First**: Every movement of money (charges, fees, payouts, refunds) is recorded as a `LedgerEntry`.
- **Stripe Integration**: Relies on Stripe for all credit card handling and actual transfers.
- **Idempotency**: Webhook handling and payout triggers are designed to be idempotent via unique `stripeId` or `bookingId` + `type` checks.

## Money Flow
1. **CHARGE**: Guest pays via Stripe Checkout. Webhook records `CHARGE` in ledger.
2. **FEE**: Platform fee (10% default) is recorded alongside the charge.
3. **PAYOUT**: After check-in/checkout, `triggerHostPayout` records the net earnings and initiates transfer to host.
4. **REFUND**: If a booking is cancelled, `processRefund` records the reversal.

## Core Services
- `modules/payouts/payout.service.ts`: Handles earnings computation and payout orchestration.
- `app/api/stripe/webhook/route.ts`: Entry point for real-time payment confirmation.

## Security
- Raw card data never touches our servers.
- Financial dashboards are restricted to listing owners.
- Admin oversight required for large manual adjustments.

## Disclaimer
This system provides operational tracking. Hosts are responsible for their own tax reporting as per local regulations.

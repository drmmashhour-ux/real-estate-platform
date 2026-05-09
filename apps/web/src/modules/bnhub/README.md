# BNHub

## Purpose

Short-term stays marketplace — an Airbnb-like experience for booking, hosting, reviews, and payments via Stripe Connect. BNHub handles everything from guest discovery to host payouts.

## Owned Routes

| Route | Description |
|---|---|
| `/bnhub` | BNHub landing page |
| `/bnhub/stays` | Browse available short-term stays |
| `/bnhub/login` | BNHub-specific authentication entry |
| `/bnhub/host/dashboard` | Host management dashboard |
| `/stays` | Public stays search |
| `/host` | Host onboarding & profile |

## Owned Data Models

| Model | Description |
|---|---|
| `BnhubStay` | Short-term stay listing with availability and pricing |
| `Booking` | Guest reservation record |
| `Payment` | Stripe-backed payment transaction |
| `Review` | Guest and host review |
| `HostQuality` | Host quality score and verification status |
| `ReferralProgram` | Referral tracking and reward logic |

## Dependencies

- **Core** — authentication and user identity
- **Stripe** — payment processing and Connect payouts
- **Compliance** — host verification and regulatory checks

## What Does NOT Belong Here

- Long-term real estate listings, buying, or selling (→ **Homes**)
- Investment analysis, ROI tools, or portfolio tracking (→ **Invest**)
- Legal forms, contracts, or signature workflows (→ **Forms**)

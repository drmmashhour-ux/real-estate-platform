# Invest

## Purpose

Investor tools — ROI calculators, rental assumption modelling, comparable analysis, portfolio snapshots, and cash-flow projections. Invest helps users evaluate deals and track performance over time.

## Owned Routes

| Route | Description |
|---|---|
| `/invest` | Investor dashboard |
| `/invest/tools/roi` | ROI calculator tool |
| `/analysis` | Deal analysis workspace |
| `/watchlist` | Saved properties & alerts |
| `/evaluate` | Quick property evaluation |

## Owned Data Models

| Model | Description |
|---|---|
| `DealAnalysis` | Saved deal analysis with assumptions and outputs |
| `PortfolioSnapshot` | Point-in-time snapshot of an investor's portfolio |
| `InvestorAlert` | Configurable alert for price/market changes |
| `WatchlistItem` | Bookmarked property for monitoring |

## Dependencies

- **Core** — authentication and user identity
- **Homes** — listing data used for comparable analysis

## What Does NOT Belong Here

- Booking flows or stay management (→ **BNHub**)
- Legal forms, contracts, or signature workflows (→ **Forms**)
- CRM, messaging, or lead scoring (→ **ImmoContact**)

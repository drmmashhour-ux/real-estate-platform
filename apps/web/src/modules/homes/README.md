# Homes

## Purpose

Buying, selling, and renting — the long-term real estate marketplace. Homes powers property listings, search, offers, mortgage tooling, and broker workflows for traditional residential transactions.

## Owned Routes

| Route | Description |
|---|---|
| `/search` | Property search with filters |
| `/properties` | Property listing index |
| `/marketplace` | Marketplace browse view |
| `/sell` | Seller onboarding & listing creation |
| `/listings/[id]` | Individual listing detail page |
| `/buy/[city]` | City-scoped buyer landing |
| `/city/[city]` | City overview & neighbourhood data |
| `/broker` | Broker-facing dashboard |
| `/mortgage` | Mortgage calculator & pre-qualification |

## Owned Data Models

| Model | Description |
|---|---|
| `Listing` | Property listing with status, pricing, and media |
| `Property` | Canonical property record (address, characteristics) |
| `Lead` | Buyer/seller lead captured from marketplace activity |
| `Offer` | Purchase or rental offer on a listing |
| `Transaction` | End-to-end deal transaction record |
| `RealEstateTransaction` | Extended transaction data specific to real estate closings |

## Dependencies

- **Core** — authentication and user identity
- **Compliance** — publish gates that must pass before a listing goes live
- **ImmoContact** — broker routing and lead handoff

## What Does NOT Belong Here

- Short-term stays or Airbnb-style booking (→ **BNHub**)
- Investment analysis, ROI calculators, or portfolio tools (→ **Invest**)
- Legal forms, contracts, or signature envelopes (→ **Forms**)

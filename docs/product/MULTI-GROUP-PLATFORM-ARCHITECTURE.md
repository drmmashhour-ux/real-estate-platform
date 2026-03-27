# Multi-group marketplace architecture

This document maps the four-audience product (buyers, DIY sellers, real estate brokers, mortgage specialists) onto the existing codebase. It complements `PlatformRole` (permissions) with a product-facing **marketplace persona** and seller **plan** fields.

## Roles vs personas

| Product role (spec) | `PlatformRole` (DB) | `MarketplacePersona` |
|---------------------|----------------------|------------------------|
| Buyer | `BUYER` (or `USER` before onboarding) | `BUYER` |
| Seller (DIY) | `SELLER_DIRECT` | `SELLER_DIRECT` |
| Broker | `BROKER` | `BROKER` |
| Mortgage broker | `MORTGAGE_EXPERT` or `MORTGAGE_BROKER` | `MORTGAGE_BROKER` |
| Admin | `ADMIN` | usually `UNSET` |

- **PlatformRole** is stored on `User.role` and controls API and hub access (broker CRM, expert dashboard, admin). Values **`BUYER`**, **`SELLER_DIRECT`**, **`MORTGAGE_BROKER`** were added for the marketplace; **`MORTGAGE_EXPERT`** remains for legacy expert rows (treated the same as `MORTGAGE_BROKER` in mortgage guards via `isMortgageExpertRole()`).
- **MarketplacePersona** (`User.marketplacePersona`) drives onboarding completion and UX copy. Onboarding **`PATCH /api/me/marketplace`** updates persona and, when allowed, syncs `User.role` via `derivePlatformRoleFromPersona()` (without downgrading verified brokers/mortgage experts to buyer/seller personas).
- **Seller plans** (`User.sellerPlan`: `basic` | `assisted` | `premium`) gate DIY features via `getSellerPlanFeatures()` in `lib/marketplace/seller-plan.ts`.

## Routes

| Flow | Path |
|------|------|
| Buyer onboarding | `/onboarding/buyer` |
| Seller (DIY) onboarding | `/onboarding/seller` |
| Broker onboarding | `/onboarding/broker` |
| Mortgage onboarding | `/onboarding/mortgage` |
| Buyer dashboard | `/dashboard/buyer` |
| Seller (DIY) dashboard | `/dashboard/seller` |
| Broker dashboard | `/dashboard/broker` (existing) |
| Mortgage dashboard (entry) | `/dashboard/mortgage` — experts redirect to `/dashboard/expert`; others see unlock steps |

Onboarding forms persist profile via `PATCH /api/me/marketplace` (`marketplacePersona`, optional `sellerPlan`, optional `name` / `phone`).

## Shared listing system

- `FsboListing` carries **`listingOwnerType`**: `SELLER` | `BROKER`, **`ownerId`** (always a `User`), optional **`tenantId`** for multi-tenant CRM.
- **`FsboListingVerification`** one-to-one: five steps (identity, cadaster, address, seller declaration, disclosures) with `VerificationStatus` (`PENDING` | `VERIFIED` | `REJECTED` — product UI may label `VERIFIED` as “approved”).
- New listings get a verification row via `POST /api/fsbo/listings` (transaction). Legacy rows are backfilled on first load of `/dashboard/seller`.

## Verification (seller_direct)

Seller hub (`/dashboard/seller`) surfaces the five mandatory steps (identity, cadaster, address, declaration, disclosures) and maps listing rows to UX states **draft** / **pending verification** / **active** using `FsboListing.status` and `moderationStatus`. Dedicated verification records can attach to this checklist as the module hardens.

## Leads and monetization (existing + planned)

- `FsboLead`, `BuyerRequest`, `AdvisoryAccess` already carry `leadSource`, `commissionEligible`, and related fields where applicable.
- Canonical source strings for marketplace analytics: `lib/marketplace/lead-routing.ts` (`MARKETPLACE_LEAD_SOURCES`, `MARKETPLACE_ROUTING_TARGETS`).
- The unified `Lead` model continues to power mortgage CRM; FSBO and buyer-request flows can mirror into it for a single funnel.

## Next steps (incremental)

1. Middleware or layout guards: optional soft redirect when `marketplacePersona` is `UNSET` and user hits a persona-specific URL.
2. Persist verification substeps per listing or per user in Prisma.
3. Wire seller plan to Stripe / billing objects already used elsewhere.
4. Single navigation component that reads `marketplacePersona` + `PlatformRole` for menu items.

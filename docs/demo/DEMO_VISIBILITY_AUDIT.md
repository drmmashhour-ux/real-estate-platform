# Demo visibility audit

Maps **dashboard and demo routes** to **data sources**, whether **`npm run demo:full`** (in `apps/web`, often with `DEMO_FULL_CLEAR=1`) populates them, gaps, and **fixes applied**.

## Canonical shortcuts (no `/dashboard` prefix)

These URLs exist at the app root (`app/(dashboard)/…`):

| Path | Behavior |
|------|------------|
| `/finance`, `/finance/invoices`, … | Redirect → billing / broker commissions |
| `/documents` | Redirect → `/dashboard/storage` |
| `/analytics` | Redirect → `/dashboard/expert/analytics` |
| `/crm` | Redirect → `/dashboard/broker/crm` |

## `/dashboard/*` aliases (fix: avoid 404s in docs)

These paths **now exist** under `app/(dashboard)/dashboard/…` and **redirect** to the real screen:

| Route | Redirect target | Notes |
|-------|-----------------|--------|
| `/dashboard/finance` | `/dashboard/billing` | Tenant invoice UI not a separate SPA; billing + seed data cover “finance” demo. |
| `/dashboard/finance/invoices` | `/dashboard/billing` | Same. |
| `/dashboard/finance/payments` | `/dashboard/billing` | Same. |
| `/dashboard/finance/commissions` | `/dashboard/broker/commissions` | `BrokerCommission` + seed. |
| `/dashboard/documents` | `/dashboard/storage` | Files + deal-room seeds. |
| `/dashboard/documents/room/[id]` | `/dashboard/storage` | Room-scoped UI not built; storage lists tenant files. |
| `/dashboard/crm` | `/dashboard/broker/crm` | Broker CRM is the implementation. |
| `/dashboard/crm/[id]` | `/dashboard/broker/clients/[id]` | Client profile detail. |
| `/dashboard/analytics` | `/dashboard/admin` | Platform charts; experts use `/dashboard/expert/analytics`. |
| `/dashboard/tenant` | `/tenant` | Single tenant overview implementation. |
| `/dashboard/tenant/settings` | `/tenant/settings` | Placeholder settings. |

## Full route audit (Part 2 checklist)

| Route | Expected visible content | Source query / service | Seeded? | Fix / gap |
|-------|----------------------------|--------------------------|---------|-----------|
| `/dashboard` | Investment portfolio cards | `investmentDeal`, user `plan` | Partial | **Not** the Prestige broker story; use `/dashboard/demo` or `/dashboard/broker`. |
| `/dashboard/broker` | Broker hub: inbox, KPIs, pipeline | `InboxSummaryCards`, Prisma counts for `BROKER` | Yes | **Fix:** Overview + commission snapshot use real CRM/offer/commission counts (not `—`). |
| `/dashboard/crm` | Redirect | — | — | **Fix:** Alias → `/dashboard/broker/crm`. |
| `/dashboard/crm/[id]` | Redirect | — | — | **Fix:** Alias → `/dashboard/broker/clients/[id]`. |
| `/dashboard/listings` | CRM listing rows | `Listing` + `getAccessibleListingsForUser` | Yes | **Fix:** Was `ShortTermListing`; now CRM + tenant scope. |
| `/dashboard/listings/[id]` | Design / AI tools (client) | APIs (`/api/ai/*`, design) | Partial | BNHub-oriented; list + offers/contracts carry the demo. |
| `/dashboard/offers` | Buyer offers | `Offer` (`buyerId`) | Yes | Log in as `michael@client.demo`. |
| `/dashboard/offers/[id]` | Offer detail | `Offer`, events | Yes | — |
| `/dashboard/contracts` | Contracts list | `Contract` | Yes | Signed, pending, partial. |
| `/dashboard/contracts/[id]` | Detail + signatures | `Contract`, `ContractSignature` | Yes | — |
| `/dashboard/documents` | Redirect | — | — | **Fix:** Alias → `/dashboard/storage`. |
| `/dashboard/documents/room/[id]` | Redirect | — | — | **Fix:** Alias → `/dashboard/storage`. |
| `/dashboard/appointments` | List | `Appointment` | Yes | Mixed statuses. |
| `/dashboard/appointments/[id]` | Detail | `Appointment` | Yes | — |
| `/dashboard/messages` | Inbox | `Conversation`, `Message`, participants | Yes | **Fix:** `lastMessageAt`, `listingId`, unread tuning. |
| `/dashboard/intake` | Client intake | `ClientIntakeProfile` | Yes | Michael linked on Prestige. |
| `/dashboard/broker/intake` | Broker intake + docs | `RequiredDocumentItem`, etc. | Yes | Mixed checklist states. |
| `/dashboard/notifications` | Feed | `Notification` | Yes | **Fix:** Initial READ + UNREAD. |
| `/dashboard/tasks` | Action queue | `ActionQueueItem` | Yes | OPEN, mixed priorities, `dueAt` on some. |
| `/dashboard/finance` | Redirect | — | — | **Fix:** Alias → billing. |
| `/dashboard/finance/invoices` | Redirect | — | — | **Fix:** Alias → billing. |
| `/dashboard/finance/payments` | Redirect | — | — | **Fix:** Alias → billing. |
| `/dashboard/finance/commissions` | Redirect | — | — | **Fix:** Alias → `/dashboard/broker/commissions`. |
| `/dashboard/analytics` | Redirect | — | — | **Fix:** Alias → `/dashboard/admin`. |
| `/dashboard/admin` | KPIs, charts, feed | `admin-analytics-service` | Partial | **Fix:** `UserEvent` day-bucketed `createdAt`. |
| `/dashboard/admin/demo` | Demo map (admin gate) | `loadDemoWalkthroughData` | Yes | **Fix:** Shared panel + data loader. |
| `/dashboard/demo` | Demo map (any user) | Same | Yes | **New:** Same links as admin demo without admin gate. |
| `/dashboard/tenant` | Redirect | — | — | **Fix:** Alias → `/tenant`. |
| `/dashboard/tenant/settings` | Redirect | — | — | **Fix:** Alias → `/tenant/settings`. |
| `/tenant` | Membership list | `TenantMembership` | Yes | **Fix:** Real rows (VIEWER clients). |
| `/tenant/settings` | Placeholder | — | N/A | UI placeholder until tenancy module UI ships. |

### Broker / CRM paths (referenced in demos)

| Route | Seeded? | Notes |
|-------|---------|--------|
| `/dashboard/broker/crm` | Yes | Pipeline, interactions, offer titles **fix** (`resolveListingTitle`). |
| `/dashboard/broker/offers` | Yes | |
| `/dashboard/broker/commissions` | Yes | `PlatformPayment` + `BrokerCommission` on demo deal. |
| `/dashboard/broker/clients/[id]` | Yes | Michael Chen profile. |

## Main scenario (Prestige)

- **Tenant:** Prestige Realty Group (`prestige-realty-demo`)
- **Broker (primary story):** David Miller — `david@prestige.demo`
- **Client:** Michael Chen — `michael@client.demo`
- **Listing:** Luxury Condo Downtown — **$750,000**
- **Entry:** `/dashboard/demo` (any role) or `/dashboard/admin/demo` (admin)

## Role checks (manual — Part 11)

| Role | Account | Verify |
|------|---------|--------|
| Global admin | Your staging admin | `/dashboard/admin`, `/dashboard/admin/demo`, cross-tenant analytics |
| Tenant owner / admin | `sarah@prestige.demo` | Listings, tenant, admin tools |
| Broker | `david@prestige.demo`, `emily@prestige.demo`, `james@urban.demo` | CRM, offers, commissions, tasks |
| Assistant | `alex@prestige.demo` | Internal thread, tasks |
| Client | `michael@client.demo`, `emma@client.demo` | Offers, intake, messages; `/tenant` memberships |

## Tenant switching (Part 12)

- Demo clients have **VIEWER** membership on **Prestige** and/or **Urban** so switching workspaces (when the shell supports it) shows **tenant-scoped** CRM/listings/offers.

## Fixes applied (summary)

1. **`resolveListingTitle`:** CRM `Listing` before BNHub listing.
2. **Listings index:** `getAccessibleListingsForUser`.
3. **Broker CRM:** Listing titles on offer rows.
4. **Notifications:** READ + UNREAD for initial payload.
5. **`/tenant`:** Live `TenantMembership` list.
6. **Demo seed:** Story data, finance, messaging, analytics, tasks (see generator + prior pass).
7. **Route aliases:** `/dashboard/finance`, `/documents`, `/crm`, `/tenant`, `/analytics`, etc.
8. **Demo hub:** `loadDemoWalkthroughData` + `DemoWalkthroughPanel`; `/dashboard/demo` and refactored `/dashboard/admin/demo`.
9. **Broker hub (`/dashboard/broker`):** Overview and commission cards use live **`BrokerClient`**, **`BrokerListingAccess`**, **`Offer`**, and **`BrokerCommission`** counts for users with role **BROKER** (demo brokers show non-zero values after `demo:full`).

## Showcase coverage (Part 6) — `demo:full` intent

| Module | Visible in UI | Seeded evidence |
|--------|----------------|-----------------|
| CRM | Stages, notes, tasks | `BrokerClient` (mixed `BrokerClientStatus`), `BrokerClientInteraction` (NOTE + TASK due today) |
| Listings | Active / negotiation / sold | Titles include `(active)`, `(under negotiation)`, `(sold)` on CRM `Listing` rows |
| Deals | Pipeline | `Deal` + milestones + documents; buyer/seller/broker demo users |
| Offers | Submitted / countered / accepted / rejected / under review | `Offer` + `OfferEvent` per tenant slice |
| Contracts | Pending / partial / signed | `Contract` + `ContractSignature`; i=0 signed, i=1 pending, i=2 partial |
| Documents | Deal room + intake | `DocumentFolder` (LISTING_ROOM, CLIENT_ROOM, CONTRACT_ROOM), `DocumentFile`, `DocumentEvent` |
| Intake | Incomplete / review / complete / rejected doc | `ClientIntakeProfile`, `RequiredDocumentItem` |
| Messaging | Thread + unread | `Conversation` + `Message`; broker `lastMessageAt` / `lastReadAt` |
| Appointments | Pending / confirmed / completed | `Appointment` + `AppointmentEvent` |
| Notifications | Unread + read | `Notification` (mixed types); non-admin sees unread-heavy default tab |
| Action queue | URGENT → LOW | `ActionQueueItem` OPEN, mixed `ActionQueueItemType` |
| Finance | Splits + invoices + payments | `DealFinancial`, `CommissionSplit`, `TenantInvoice`, `PaymentRecord`, `PlatformPayment`, `BrokerCommission` |
| Analytics | Time series + feed | `UserEvent`, `platformAnalytics`, `DemoEvent` |
| Tenant | Two workspaces | `TenantMembership` (brokers + VIEWER clients on Prestige / Urban) |

## Final validation checklist (Part 15 — manual)

After `DEMO_FULL_CLEAR=1 npm run demo:full`:

1. Open `/dashboard/demo` — links resolve (no “run seed first” for Prestige).
2. Broker: `/dashboard/broker` — inbox cards + overview numbers (not all em dashes).
3. `/dashboard/broker/crm`, `/dashboard/listings`, `/dashboard/broker/offers`, `/dashboard/contracts`, `/dashboard/messages`, `/dashboard/tasks`, `/dashboard/notifications`, `/dashboard/deals`, `/dashboard/broker/commissions` — populated.
4. Client: `/dashboard/offers`, `/dashboard/intake`, `/dashboard/messages`.
5. Admin: `/dashboard/admin` — charts/feed not empty when events exist.
6. `/tenant` — two rows for dual-member client accounts.
7. No cross-tenant leakage (spot-check Urban vs Prestige broker).

## Known gaps

- **Tenant invoice** screens are not separate routes; **billing** + **broker commissions** + DB rows are the visible finance story.
- **Listing detail** remains design/BNHub-heavy.
- **Expert analytics** (`/dashboard/expert/analytics`) is mortgage-expert-specific; platform charts: **`/dashboard/admin`**.

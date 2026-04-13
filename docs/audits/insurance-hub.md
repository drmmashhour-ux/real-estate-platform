# Insurance Broker Hub — audit

## Structure

- **Route:** `/dashboard/insurance` (server page + `InsuranceDashboardClient`).
- **Access:** `PlatformRole` `INSURANCE_BROKER` or `ADMIN` (others redirect to `/dashboard`).
- **Data:** Existing `InsuranceLead` model (`PROPERTY` + `TRAVEL` types in hub scope). Optional `assignedBrokerUserId` for future assignment rules.
- **APIs:**
  - `GET /api/dashboard/insurance/leads` — list + KPI aggregates (scoped for brokers).
  - `PATCH /api/dashboard/insurance/leads/[id]` — status transitions (brokers + admins).
- **Lead capture (unchanged pipeline):** `POST /api/insurance/leads` — listing modal (`BuyerListingDetail`) and BNHUB `BookingForm` create rows that appear in the hub when types match.

## Features added

- KPI row: new leads, quotes sent (`SENT`), policies closed (`CONVERTED`), conversion rate (informational).
- Leads table with status select, View / Contact / Mark contacted.
- Quick actions, AI recommendations (heuristic copy — not underwriting).
- Empty state + CTA to `/listings`.
- “Why insurance matters” trust copy.
- Navigation: Financial Hub nav item, hub switcher path, `MarketplaceHubLinks` entry (admin + insurance broker only).
- Prisma: `InsuranceLeadStatus.CONTACTED`, `InsuranceLead.assignedBrokerUserId` (+ index).

## Placeholders vs real data

| Area | Behavior |
|------|----------|
| KPI conversion rate | `CONVERTED` ÷ pipeline excluding `REJECTED`; label clarifies it is informational. |
| AI block | Rule-based suggestions from lead counts and heuristics — not ML pricing or risk scoring. |
| “Policies closed” | **CRM milestone** (`CONVERTED`) — not confirmation of an issued policy. |
| Auto email → `SENT` | Existing POST flow may set `SENT` when partner email sends; brokers can also set `SENT` manually in the hub. |

## Next backend steps

1. **Assignment:** Round-robin or territory-based `assignedBrokerUserId` when leads are created; restrict broker `GET` to assigned rows only if desired.
2. **Migration:** Repo `prisma migrate` shadow DB may fail in some environments; production should use a normal migration for `CONTACTED` + `assigned_broker_user_id`.
3. **Tests:** Extend `app/api/insurance/leads/route.test.ts` and add coverage for `PATCH` `/api/dashboard/insurance/leads/[id]` auth.
4. **Persona onboarding:** Optional `MarketplacePersona` / onboarding path for `INSURANCE_BROKER` if self-serve signup is required.

# Mortgage commission, terms & notifications

## Schema

- `MortgageExpert`: `acceptedTerms`, `acceptedAt`, `commissionRate` (default 0.30), `notificationsLastReadAt`
- `MortgageDeal`: one row per closed mortgage lead (`leadId` unique) with `dealAmount`, `platformShare`, `expertShare`, `status` (`closed` | `adjusted` | `void`)
- `ExpertInAppNotification`: in-app rows for the expert bell (new leads)

## Flows

1. **Signup** → `/expert/terms` → accept → `/dashboard/expert`
2. **Login** → response includes `expertTermsAccepted`; client sends experts without terms to `/expert/terms`
3. **Dashboard/layout** redirects to `/expert/terms` if `acceptedTerms` is false
4. **Lead assignment** only considers experts with `isActive` and `acceptedTerms`
5. **New lead** → `sendDashboardNotification` (DB) + `sendEmailNotification` (Resend when configured), with client email, price, estimated mortgage
6. **Close deal** → expert POST `/api/mortgage/expert/leads/[id]/close-deal` → creates `MortgageDeal`, sets lead `pipelineStatus` to `closed`
7. **Admin** → `/admin/mortgage-deals` to verify/adjust splits (must sum to `dealAmount`)

## Migration

Run `npx prisma migrate deploy` in `apps/web`.

Existing rows in `mortgage_experts` at migration time are grandfathered to `acceptedTerms = true`. **New** experts created after migration default to `acceptedTerms = false` until they accept on `/expert/terms`.

## Core helpers

- `lib/notifications.ts` — `sendDashboardNotification`, `sendEmailNotification`
- `lib/mortgage/commission.ts` — `splitMortgageCommission`

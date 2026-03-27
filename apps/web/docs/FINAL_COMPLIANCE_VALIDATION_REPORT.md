# Final compliance & validation report (Quebec / financial)

_Date: 2026-03-20_  
_(Screenshots: not attached in-repo — review this document + UI in staging.)_

## Corrected / added components

| Area | Change |
|------|--------|
| **Investment features** | Default **off**: `INVESTMENT_FEATURES_ENABLED` env + `PlatformFinancialSettings.investmentFeaturesEnabled` (false). AMF warning in `lib/compliance/investment-features.ts`. APIs gated via `investment-api-guard`. `/dashboard/investments/*` **layout redirects** when disabled. Hub switcher **hides** Investments after `GET /api/config/investment-status`. Contracts list **hides** `investment_agreement` when disabled. |
| **Broker / owner compliance** | `lib/compliance/professional-compliance.ts`: verified **broker** ( `BrokerStatus.VERIFIED` + `BrokerVerification.VERIFIED` ) for broker listings & deals; verified **owner** pipeline for owner listings. **Publish**: `canPublishListingMandatory` extended for `listingAuthorityType === BROKER` (license + brokerage fields + broker compliance). **Create**: `POST /api/bnhub/listings/create`, `POST /api/listings` call `assertCanCreateListing`. **Deals**: `POST /api/deals` requires broker compliance for `role === BROKER`. |
| **Revenue separation** | Existing `PartyRevenueLedgerEntry` + commission split unchanged; **settlement trace** embedded in `PlatformPayment.taxCalculationJson.settlementTrace` (totals per side + GST/QST cents + tax resolution metadata). |
| **Split invoices** | `PlatformInvoice.invoiceIssuer`: **PLATFORM** vs **BROKER**; `@@unique([paymentId, invoiceIssuer])`; labels `invoiceLabel`. Webhook creates **separate rows** (platform payer + broker recipient when commission + broker tax profile exist). Numbers `INV-P-…` / `INV-B-…`. Fallback single PLATFORM invoice if split builder yields none. |
| **Tax engine (controlled)** | `resolveTaxFlagsForPaymentType` (`lib/finance/payment-type-tax.ts`): global toggles → **per `payment_type` JSON** (`paymentTypeTaxOverrides`) → **`taxOverrideJson` on payment** (admin/accountant). No blind global apply. |
| **Broker commission invoices** | `buildBrokerCommissionIssuerTaxDetails` — broker GST/QST on file; platform block is facilitator note only. |
| **Billing APIs** | `GET /api/billing/platform-invoices` → **PLATFORM** issuer only (payer). **New** `GET /api/billing/broker-invoices` → **BROKER** issuer (broker dashboard use). |
| **Admin settings** | `PATCH /api/admin/finance/platform-settings`: `paymentTypeTaxOverrides`, `investmentFeaturesEnabled`. |
| **Tests** | `lib/__tests__/payment-type-tax.test.ts`; `app/api/deals/route.test.ts` updated for broker verification mocks. |

## Remaining issues / gaps

1. **Migrations**: Apply `20260320120000_compliance_invoices_tax` (and prior finance migrations) to production; backfill `invoice_issuer = PLATFORM` is default.  
2. **Broker invoice without tax profile**: If commission > 0 but no `BrokerTaxRegistration` snapshot, **no BROKER issuer row** is created (only PLATFORM / fallback). Product decision: require registration before paying broker share, or emit zero-GST broker receipt.  
3. **Payer receipt vs split**: When only broker line has value, payer may lack a full “total paid” invoice — **settlement trace** on the payment is the audit source; consider a dedicated “payment confirmation” doc later.  
4. **Payment `taxOverrideJson` UI**: Overrides are supported in code; **no dedicated admin UI** in this pass (set via API/DB).  
5. **Wider surface**: Other “investment” copy on marketing pages / AI dashboard links not exhaustively removed — search for `/dashboard/investments` when enabling.  
6. **OACIQ**: Platform enforces **internal** verification states, not regulator API.  

## Legal / compliance risks (non-exhaustive)

| Risk | Mitigation implemented |
|------|-------------------------|
| Securities / AMF | Investment flows **disabled** by default + explicit code warning + admin/env gate. |
| Tax positions | GST/QST are **configuration + engine outputs**; disclaimers preserved; accountant must validate. |
| Brokerage activity | Broker listings/deals gated on **platform broker verification** + listing fields. |
| Data exposure | Finance routes remain **ADMIN / ACCOUNTANT**; billing invoices **session + own user** only. |

## Financial system status

- **Ledger**: Party ledger + settlement trace on payment.  
- **Invoices**: Split issuers when data allows; traceable totals.  
- **Tax**: Per-type + override layering implemented.  
- **Payouts**: Still **manual batch** model; trace points in `settlementTrace` + `BrokerPayout` (existing).  

## Validation run (automated)

```bash
npx vitest run lib/__tests__/payment-type-tax.test.ts app/api/deals/route.test.ts
```

- **8 tests passed** (local run).  
- Full suite + Stripe e2e not run in this pass.  

## Launch readiness (high-level)

**Not a legal sign-off.** Before production: run migrations on staging, test a real Stripe payment (split invoices + ledger), verify broker/owner gates with real roles, and have **Quebec counsel + accountant** review tax and brokerage positioning.

---

**Goal alignment:** Stricter enforcement hooks, split invoices, controlled tax, investment hub off by default, broker/owner gates for listings & deals — **implemented in code**; **operational readiness** depends on migration, QA, and professional review.

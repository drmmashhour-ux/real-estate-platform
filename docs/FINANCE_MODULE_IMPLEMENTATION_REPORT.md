# Finance & accounting module — implementation report

## Roles & access

| Role        | Access |
|------------|--------|
| **ADMIN**  | Full admin + all finance routes, automation cron attribution uses an admin user when invoked via secret. |
| **ACCOUNTANT** | Finance dashboard, platform transactions, commissions, manual broker payouts, tax documents, reports/exports, income & RE deal monitor pages. No system config / user deletion (same as before; enforce on new admin routes as you add them). |

**Assignment:** `ACCOUNTANT` is not self-registerable; set `User.role = ACCOUNTANT` in the database or via a guarded admin tool.

## Pages & modules

| Path | Purpose |
|------|---------|
| `/admin/finance` | Financial dashboard: revenue (range, month, year), payment counts, refunds, Stripe fees, commission aggregates, broker owed/paid, ledger preview, export links. |
| `/admin/finance/transactions` | Filterable **platform** payments (Stripe-linked): user, broker, dates, type, listing/booking/deal refs, keyword search. |
| `/admin/commissions` | Commission rows with payment context (financial staff). |
| `/admin/finance/payouts` | **Manual** broker payout batches: create from pending commissions → Approve → Mark paid (records only). |
| `/admin/finance/tax` | Generate internal summaries; filter list; PDF download; delete record. |
| `/admin/finance/reports` | Hub links to secured export URLs + automation note. |
| `/admin/income`, `/admin/transactions` | Existing pages; gated with `isFinancialStaff`. |

**Admin navigation** includes dedicated finance submenu items. **Accountant** home lists the same finance entry points.

## API (all require finance session unless noted)

- `GET/POST /api/admin/finance/tax` — list (with query filters) / generate documents.
- `GET /api/admin/finance/tax/[id]/pdf` — PDF (auth).
- `DELETE /api/admin/finance/tax/[id]` — remove document row (audit logged).
- `GET /api/admin/finance/transactions` — paginated payments + commissions.
- `GET/POST /api/admin/finance/payouts` — list batches + pending commissions / create batch.
- `PATCH /api/admin/finance/payouts/[id]` — approve, mark paid, cancel, mark failed (audit with before/after metadata).
- `GET /api/admin/finance/export` — `type=transactions|revenue|payouts|tax_register|commissions`, `format=csv|pdf` (tax_register CSV only; commissions CSV only).
- `POST /api/admin/finance/automation` — monthly/yearly `TaxDocument` (cron **or** financial staff session).

## Stripe sync

- Webhook continues to record payments, fees, refunds, ledger entries (idempotent by `stripeEventId`).
- Payment type **`featured_listing`** added to checkout + webhook allowlist for future use.
- `PlatformPayment` now has **`updatedAt`** for “last change” tracking.

## Database

Run after pull:

```bash
cd apps/web && npx prisma migrate deploy
# or: npx prisma db push
npx prisma generate
```

New: `BrokerPayout`, `BrokerPayoutLine`, `BrokerPayoutStatus`, `TaxDocument.status`, `TaxDocument.issueDate`, `PlatformPayment.updated_at`.

> If `migrate` fails on FK table names, your DB may use a different `User` table mapping — adjust the migration or use `db push` in development.

## Exports

- **PDF**: truncated row counts for large datasets; use **CSV** for full reconciliation.
- **Excel**: CSV with UTF-8 (opens in Excel); no native `.xlsx` yet.

## Audit

`FinancialAuditLog` records list views, exports, tax generate/delete/PDF, payout create/transitions, automation runs. Payout PATCH includes `before`/`after` status in metadata.

## Tests added

- `lib/admin/__tests__/finance-access.test.ts`
- `lib/admin/__tests__/broker-payout-actions.test.ts`

## Limitations & risks (for CPA / engineering)

1. **Not tax software** — documents are labeled internal; GST/QST and statutory filing need a qualified accountant.
2. **Manual payouts** — “Mark paid” does not move money; it only updates DB state.
3. **Refunds vs commissions** — commission rows are not automatically reversed when refunds occur; reconcile manually or extend webhooks/rules.
4. **Reconciliation** — always match totals to Stripe Dashboard and bank statements.
5. **Public URLs** — finance PDFs/CSVs are served only through authenticated API routes, not static public folders.

## Still incomplete / optional next steps

- Native **xlsx** export library.
- **Void** workflow for tax docs (currently delete; optional `status: void` without delete).
- Automatic **email** on automation (optional env recipients already partially wired).
- Stronger **commission adjustment** jobs after partial refunds.
- **End-to-end** Playwright tests for finance UI.

---

_Last updated: implementation pass for broker payouts, expanded dashboard, transactions UI, exports, tax filters, Stripe `featured_listing`, tests._

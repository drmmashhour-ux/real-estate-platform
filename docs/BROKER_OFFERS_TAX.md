# Broker contracts, auto offers, and tax summaries (LECIPM)

## Apply migrations

```bash
cd apps/web && npx prisma migrate deploy
```

## APIs

| Endpoint | Purpose |
|----------|---------|
| `POST /api/contracts/broker/create` | Broker agreements (seller, buyer, referral, collaboration) |
| `POST /api/offers/create` | Purchase / rental offer documents + linked e-sign contract |
| `GET /api/tax/broker-summary?year=2026` | Broker income, expenses, unsuccessful transaction totals |
| `GET /api/tax/broker-summary?format=csv` | CSV export |
| `GET /api/tax/platform-summary?from=&to=` | Admin: platform revenue + GST/QST from paid `PlatformPayment` rows |
| `POST /api/broker/transaction-records` | Record won/lost/pending deals (`lossReason` recommended when `outcome=lost`) |
| `POST /api/broker/expenses` | Broker expenses with optional GST/QST on expense |

## Wording

- Use **unsuccessful transaction**, **lost transaction**, or **transaction loss record** — not informal phrasing.

## Disclaimers

- Tax outputs are **internal summaries**, not government filings or professional tax advice.
- Offer templates are **drafts** — review with counsel before reliance.

## GST/QST helpers

`lib/tax/quebec.ts` wraps `lib/tax/quebec-tax-engine.ts` (defaults 5% / 9.975%).

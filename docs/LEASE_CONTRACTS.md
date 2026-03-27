# Lease contracts & e-sign (BNHub)

## Database

Apply migration:

```bash
cd apps/web && npx prisma migrate deploy
# or during development: npx prisma db push
```

## Flow

1. **Generate** — Host or guest on a **CONFIRMED** or **COMPLETED** booking uses **Generate lease** on the booking page (`/bnhub/booking/[id]`), or `POST /api/contracts/create` with `listingId` + `bookingId`.
2. **Sign** — Parties open `/contracts/[id]`, type full legal name; IP + timestamp stored on `ContractSignature`.
3. **PDF** — `GET /api/contracts/[id]/pdf` (authenticated participants or admin).

## Email

Uses `lib/email/send.ts`. Configure `RESEND_API_KEY` / `SENDGRID_API_KEY` / `EMAIL_API_KEY` for production delivery.

## Legal

Templates are for workflow and documentation; **have Québec counsel review** before relying on them in disputes.

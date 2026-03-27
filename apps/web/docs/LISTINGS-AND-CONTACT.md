# Listings, client–broker contact, and ImmoContact

## Listings across sections

The platform has **listings in multiple sections**. Data is provided by:

1. **Simulation seed** (when you run `npm run seed` with a database):
   - **BNHub (short-term rentals):** 4 listings (Montreal, Mont-Tremblant; published/draft).
   - **Property (sale/long-term):** 1 property (Demo City).
   - **Projects (new developments):** 2 projects with units (Riverside Towers, Plateau Living).

2. **Demo/mock data** (no database required):
   - **Projects:** `/api/projects` returns demo projects from `lib/data/demo-projects.ts` (e.g. Lumiere Montreal) when the DB is empty or as fallback.

So **listings are “uploaded” in all relevant sections** when you run the seed; without a DB, only the projects list is populated via demo data. To get BNHub listings, sale properties, and project units in the DB, run:

```bash
# Set DATABASE_URL in .env, then:
npx prisma migrate deploy
npm run seed
```

---

## Client–broker and client–host contact

Contact between **clients and brokers** (and guests and hosts) works as follows:

| Flow | Where | How |
|------|--------|-----|
| **Contact page → broker** | `/contact` | User submits the form → **POST /api/contact** creates a **Lead** with `status: "contact_inquiry"` and no project/listing. Brokers see these under **Broker** dashboard → **Contact page inquiries**. Optional email to `BROKER_EMAIL` when Resend is configured. |
| **Project/listing lead → broker** | Project or listing page | User submits a lead form with `projectId` or `listingId` → **POST /api/leads** creates a **Lead**. Brokers see these in **Broker** dashboard → **Project Leads** and in **Leads** dashboard. |
| **BNHub guest ↔ host** | Booking detail / messages | After a booking exists, guest and host chat via **POST /api/bnhub/messages** (booking-scoped). UI: **Messages** and booking thread. |
| **Transaction buyer/seller/broker** | Transaction detail | Buyer, seller, and broker exchange messages via **TransactionMessage** and **POST /api/transactions/[id]/messages**. |

So:
- **Contact page** submissions are stored as leads and shown to brokers (no ImmoContact).
- **Project/listing** leads are stored and shown in broker and leads dashboards.
- **BNHub** messaging is guest–host per booking.
- **Transactions** have their own in-app messaging between buyer, seller, and broker.

---

## ImmoContact

**ImmoContact is not installed or integrated** in this codebase. There are no references to ImmoContact, immocontact, or immo-contact in the repo.

The platform instead provides:

- **Contact page** → saved as **Lead** (contact inquiries) and visible in the **Broker** dashboard.
- **Leads API** (`/api/leads`) for project/listing leads and contact inquiries, with optional email to broker.
- **BNHub** and **transaction** messaging as above.

If you need ImmoContact (or a similar CRM), it would require either:

- Integrating an external ImmoContact API (if they offer one), or  
- Extending the current lead/contact system (e.g. statuses, assignment to brokers, activities) to behave like a simple CRM.

---

## Summary

| Question | Answer |
|----------|--------|
| Listings in all sections? | Yes, via **seed**: BNHub listings, sale property, projects with units. Run `npm run seed` with DB. Projects list also has demo data without DB. |
| Client–broker contact? | Yes: **Contact page** → Lead → Broker dashboard “Contact page inquiries”; **project/listing leads** → Broker/Leads dashboards; **transaction messages** for deal parties. |
| ImmoContact installed? | **No.** Not in the codebase. Current contact/lead system is custom (Contact + Leads API + broker UI). |

# Investor demo — end-to-end verification checklist

Use this before an investor demo to confirm the platform is **stable**, **complete**, and **demo-ready**.

---

## Goal

Test the entire platform end-to-end before investor demo.

Verify:

- All hubs work  
- Legal enforcement works  
- AI features work  
- UI is clean  
- No critical bugs  

---

## Part 1 — Setup

From repository root, the primary app is **`apps/web`**.

1. **Run platform locally**

   ```bash
   cd apps/web && npm install && npm run dev
   ```

   App defaults to **http://localhost:3001** (see `apps/web` `package.json` `dev` script).

2. **Apply migrations**

   ```bash
   cd apps/web && npx prisma migrate deploy
   ```

   For local development against a fresh database you may use `npx prisma migrate dev` instead (creates/applies migrations interactively). See [DEPLOYMENT.md](./DEPLOYMENT.md) for production rules.

3. **Seed demo data**

   - Baseline seed (Prisma): `cd apps/web && npm run seed`  
   - Full demo tenants/users/listings (recommended for demos): `cd apps/web && npm run demo:full`  

   Demo accounts and passwords: [demo/DEMO_ACCOUNTS.md](./demo/DEMO_ACCOUNTS.md).

4. **DEMO_MODE**

   In `apps/web/.env` (see `.env.example`):

   - `DEMO_MODE=1`  
   - `NEXT_PUBLIC_DEMO_MODE=1`  

   **Important:** `DEMO_MODE` **blocks most API mutations** not on the allowlist (403 + `code: DEMO_MODE`). For **full** end-to-end tests (create listings, sign contracts, payments, etc.), run those flows with **DEMO_MODE off** locally, or confirm each flow is allowlisted. Details: [DEMO_MODE_API_ROUTES.md](./DEMO_MODE_API_ROUTES.md).

   Quick login buttons on `/auth/login` require staging/demo flags — see [demo/DEMO_ACCOUNTS.md](./demo/DEMO_ACCOUNTS.md).

---

## Part 2 — Buyer flow test

Test:

- `/buy`  
- Search listings  
- Open listing page  
- Use mortgage calculator  
- Contact listing broker  
- Request platform broker  
- Request mortgage  

Verify:

- Leads created  
- Conversations created  

---

## Part 3 — Seller flow test

Test:

- Create listing  
- Upload photos  
- Complete seller declaration  
- Upload documents  
- Sign contracts  

Verify:

- Cannot submit if missing  
- Status changes correctly  

---

## Part 4 — NBHub test

**Long-term**

- Create rental listing  
- Contact landlord  

**Short-term**

- Create host listing  
- Book stay  
- Payment flow  
- Commission calculated  

---

## Part 5 — Mortgage hub test

- Submit mortgage request  
- Verify broker receives it  
- Conversation created  

---

## Part 6 — Contract system test

Test:

- Required contracts enforced  
- Cannot proceed without signing  

Verify:

- Signatures stored  
- Timestamps recorded  

---

## Part 7 — AI test

Test:

- Drafting assistant  
- Market insights  
- Financial calculations  

Verify:

- No errors  
- Correct outputs  

---

## Part 8 — Investor hub test

Test:

- `/investor`  
- Dashboard loads  
- Charts display  
- AI insights visible  
- Notifications appear  

---

## Part 9 — UI test

Check:

- No empty pages  
- Loading states work  
- Errors handled properly  
- Layout clean  

---

## Part 10 — Role test

Log in as:

- Buyer  
- Seller  
- Broker  
- Landlord  
- Host  
- Investor  

Verify:

- Correct dashboards  
- Correct permissions  

Use seeded accounts where applicable ([demo/DEMO_ACCOUNTS.md](./demo/DEMO_ACCOUNTS.md)); create or promote users as needed for landlord/host/investor if not present in seed.

---

## Part 11 — Final result

Platform must be:

- Stable  
- Complete  
- Demo-ready  

If any issue is found:

→ **Fix immediately before demo.**

---

## See also

- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) — env vars and production rules  
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) — broader release checks  
- [STAGING_ENVIRONMENT.md](./STAGING_ENVIRONMENT.md) — staging deploy and DB  

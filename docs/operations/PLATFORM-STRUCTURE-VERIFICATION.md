# Platform Structure Verification

Status: **Verified** — Last checked against target architecture.

---

## Target vs current structure

| Target | Current | Status |
|--------|---------|--------|
| **/apps/web** | **/app** (Next.js App Router) | ✅ Web app lives at repo root; `app/` is the web app. |
| **/apps/mobile-app** | — | ⏳ Not yet; planned (see [PROJECT-OVERVIEW](PROJECT-OVERVIEW.md)). |
| **/packages/ui** | Shared UI in **app/** components + **app/globals.css** | ⚠️ No separate package; UI is in-app. Acceptable for single app. |
| **/packages/database** | **prisma/** (schema, migrations) | ✅ Database layer present. |
| **/packages/auth** | **lib/supabase.ts** (Supabase client) | ✅ Auth client present; no separate package. |
| **/packages/api** | **app/api/** (Next.js Route Handlers) | ✅ API routes in app; add under `app/api/` as needed. |
| **/services/ai** | — | ⏳ Planned; not implemented. |
| **/services/trust-safety** | **docs** (governance, verification workflow) | ⚠️ Documented; verification workflow in progress. |
| **/services/bn-hub** | **app/bnhub/**, **lib/bnhub/**, **app/api/bnhub/** | ✅ Implemented as module. |
| **/services/broker-crm** | — | ⏳ Planned. |
| **/docs** | **docs/** | ✅ Present. |
| **docs/PLATFORM-MISSION.md** | Yes | ✅ |
| **docs/PLATFORM-GOVERNANCE.md** | Yes (named PLATFORM-GOVERNANCE.md) | ✅ |

---

## What was verified

- **Routes** — Next.js App Router; routes under `app/*` work (/, /properties, /about-platform, /contact, /admin, /messages). BNHub routes under /bnhub.
- **Pages load** — Static and dynamic pages; no heavy blocking.
- **Links** — Header nav: Home, Properties, About platform, Contact. Footer present. BNHub linked when module exists.
- **Duplicates** — No duplicated page or component files found.
- **API** — No central API base yet; BNHub adds `app/api/bnhub/*` and server actions where needed.
- **Database** — Prisma + PostgreSQL; schema includes User, Property, and BNHub models (ShortTermListing, Booking, etc.).

---

## Recommendations

1. **Keep current layout for now** — Single Next.js app with `app/`, `lib/`, `prisma/` is a stable foundation. Migrating to a full monorepo (`apps/`, `packages/`) can come when adding mobile or multiple frontends.
2. **Modularize inside the app** — Use `app/bnhub/`, `app/api/bnhub/`, `lib/bnhub/` so BNHub is a clear module. Same pattern later for broker-crm, ai, trust-safety.
3. **Add services as you need them** — When building AI or trust-safety, add `lib/ai/`, `lib/trust-safety/` and optional `app/api/` routes rather than empty folders.
4. **Mobile later** — After first stable web version and beta, add mobile (e.g. React Native or separate repo) and consider monorepo then.

---

## BNHub implementation (current)

- **Listing system**: Create/search listings; night price, photos, availability model; verification status and trust badge.
- **Booking system**: Search → select property → choose dates → request to book → confirmation; guest/host dashboards.
- **Payment system**: Fee calculation (guest ~12%, host ~3%); `Payment` record and `hostPayoutCents`; Stripe integration placeholder.
- **Host dashboard**: Listings, add listing form, bookings, earnings summary; demo via `NEXT_PUBLIC_DEMO_HOST_ID` or `?ownerId=`.
- **Review system**: Guests can leave property (+ optional host) rating and comment after completed stay; reviews feed trust score.
- **First user flow**: Sign in (or set `NEXT_PUBLIC_DEMO_GUEST_ID`) → search `/bnhub` → book → host sees booking in dashboard → complete → guest leaves review at `/bnhub/booking/[id]/review`.

## Next steps (after BNHub core)

- [ ] Add Stripe (or chosen provider) for payments.
- [ ] Implement trust workflow: document upload → cadastre validation → admin verify → badge.
- [ ] Connect AI Control Center stubs (recommendations, fraud signals, pricing).
- [ ] Performance pass: image optimization, caching, DB indexes.
- [ ] Beta launch target: 50–100 properties, 20–50 users, 5–10 hosts.

---

*See [PROJECT-OVERVIEW](PROJECT-OVERVIEW.md) and [BNHUB-BUSINESS-MODEL](BNHUB-BUSINESS-MODEL.md).*

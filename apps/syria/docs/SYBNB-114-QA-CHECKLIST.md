# SYBNB-114 — Pre-launch QA checklist (Hadiah Link / `apps/syria`)

**Goal:** Verify core flows before real users — **no crashes**, **correct data**, **safe payments in test mode**.

**Environment:** Use a **staging** deploy + **staging DB** (never Canada `apps/web` DB — see isolation rules). Record **build/commit**, **date**, and **tester**.

| Area | Pass | Notes |
|------|------|--------|
| Env / DB | ☐ | `pnpm env:check` (Syria), correct `DATABASE_URL` |
| Smoke | ☐ | Home loads, locale `/ar/` works |

---

## 1. Listing creation

| Step | Pass | Notes |
|------|------|--------|
| **A — Quick / low-friction (guest)** | ☐ | Open **`/quick-post`** — complete flow **without** login where product allows (anonymous / phone guest per SYBNB-93). Publish → land on listing or success state. |
| **B — Authenticated property listing** | ☐ | Sign in → create listing from dashboard/sell flow **with login** — full property fields as applicable. |
| **Photos** | ☐ | Upload **3–5** images; confirm URLs persist after refresh. |
| **Amenities** | ☐ | Select several amenities; save; reopen edit — selections stored. |
| **Arabic description** | ☐ | Enter Arabic body text; listing detail shows it with sensible line breaks / RTL. |

**Fail if:** validation errors loop, images missing after publish, amenities lost.

---

## 2. Listing display

Open **`/{locale}/listing/{id}`** for a published listing.

| Check | Pass | Notes |
|-------|------|--------|
| Images | ☐ | Gallery loads; broken placeholders absent |
| Badges | ☐ | Where applicable: **جديد** (`isNewListing` window), trust / verified badges (موثوق / إعلان موثوق — depends on seller + listing flags + `SYRIA_MVP`) |
| Amenities | ☐ | Match edit form (localized labels) |
| Description | ☐ | RTL, no HTML injection, truncation OK on mobile |

---

## 3. Contact

As a **non-owner** visitor:

| Step | Pass | Notes |
|------|------|--------|
| **عرض رقم الهاتف** | ☐ | Tap **Show phone** — number reveals; SYBNB anti-spam counters behave (no crash). |
| WhatsApp | ☐ | WhatsApp opens with sensible prefilled text / listing context. |
| On-platform message | ☐ | Submit message form — success path (rate limits may apply per IP). |

**Fail if:** owner sees guest CTAs when logged in as owner; clicks double-fire obvious errors in console.

---

## 4. Share

On listing detail:

| Step | Pass | Notes |
|------|------|--------|
| **مشاركة (WhatsApp)** | ☐ | Opens WhatsApp; body matches viral template (`buildListingShareMessage`) + link includes `hl_share=whatsapp` where implemented. |
| **نسخ الرابط** | ☐ | Clipboard URL opens listing; includes `hl_share=copy_link`. |
| Abuse caps | ☐ | (Optional) After heavy repeated shares same day — expect **`429`** `share_rate_limited` from `/api/analytics/event` per SYBNB-113 (max **20**/actor/day default). |

---

## 5. Report

**Requirement:** Marketplace report API **`POST /api/listings/[id]/report`** requires a **signed-in** user (`401` if anonymous).

| Step | Pass | Notes |
|------|------|--------|
| Submit report | ☐ | Logged-in non-owner submits valid `reason` (`spam` \| `fake` \| `wrong_info` \| `other`). |
| DB row | ☐ | `syria_listing_reports` has new row (`SyriaListingReport`). |
| **5 reports → hidden** | ☐ | After **5** qualifying reports **on that listing** (count combines marketplace **`SyriaListingReport`** + stay **`ListingReport`** per `countReportsForProperty`), property becomes **`NEEDS_REVIEW`** + **`needsReview: true`** — hidden from public browse (`SY8_REPORTS_THRESHOLD` = **5** in `src/lib/sy8/sy8-constants.ts`). Use **5 test accounts** or **admin/seed** if duplicate reports from one user are blocked by UI. |

---

## 6. Filters

| Step | Pass | Notes |
|------|------|--------|
| Amenities | ☐ | Browse (**`/buy`**, **`/rent`**, etc.) — filter by amenity; results narrow correctly. |
| City | ☐ | Filter by city / area — listings match selection. |
| Empty state | ☐ | Absurd filter combo → empty list without crash. |

---

## 7. Performance (mobile / slow network)

| Check | Pass | Notes |
|-------|------|--------|
| First paint | ☐ | Chrome DevTools → **Slow 3G** / **Fast 3G** — shell usable &lt; reasonable subjective bar |
| Images | ☐ | Below-fold images **lazy** load (no massive simultaneous downloads) |
| CLS | ☐ | No brutal layout jump when images arrive |

---

## 8. Payment (test mode)

**Do not** use production cards until policy allows. Follow **`docs/payment-activation-checklist.md`** (locks, `SYBNB_PRODUCTION_LOCK_MODE`, kill switches).

| Step | Pass | Notes |
|------|------|--------|
| Stripe test keys | ☐ | Staging env with **test** keys + webhook secret where applicable |
| Booking → payment | ☐ | Short-stay / BNHub path per product: request booking → payment intent / manual path as configured → **`CONFIRMED`** / paid state as designed |
| Idempotency | ☐ | No double charge on retry (observe logs / Stripe dashboard **test mode**) |

---

## Success criteria

- ☐ No unhandled runtime crashes on listed paths  
- ☐ Listing CRUD + display + contact + share + report + browse filters behave as specified  
- ☐ Payments only exercised under **test** PSP configuration  

## Related docs

- `docs/payment-activation-checklist.md` — PSP / Stripe rollout  
- `docs/env-deployment.md` — env expectations  

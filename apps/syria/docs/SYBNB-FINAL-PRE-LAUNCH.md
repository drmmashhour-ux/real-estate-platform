# SYBNB-FINAL — Pre-launch lock (`apps/syria`)

**Goal:** Freeze scope for first real users — stable defaults, clean DB posture, auditable limits, and acceptance checks.

---

## Phase 1 — Disable test / dev mode (ENV)

| Variable | Production intent |
|----------|---------------------|
| **`SYBNB_TEST_MODE`** | **`false`** — synthetic rows (`isTest=true`) must not be created against prod DB. See `src/lib/sybn/sybn108-test-mode.ts`. |
| **`SYBNB_PAYMENTS_ENABLED`** | **`false`** unless PSP sandbox + checklist complete ([`docs/payment-activation-checklist.md`](./payment-activation-checklist.md)). Effective gates also use `SYBNB_PRODUCTION_LOCK_MODE` (`src/config/sybnb.config.ts`). |

Templates: [`.env.production.example`](../.env.production.example), [`.env.example`](../.env.example).

---

## Phase 2 — Clean data

1. **Remove test-flagged rows** (`isTest=true`): Syria marketplace listings (`SyriaProperty`), bookings (`SyriaBooking`, `SybnbBooking`), synthetic users (`SyriaAppUser`).
2. **Mechanism:** admin **`POST /api/admin/clear-test-data`** → `clearAllSybn108TestData()` (`src/lib/sybn/sybn108-clear-test-data.ts`). Requires admin session.
3. **Keep:** real listings only; optional curated demo listings **without** `isTest` if ops maintain them.

---

## Phase 3 — Verify core flows (must work)

Use **[SYBNB-114-QA-CHECKLIST.md](./SYBNB-114-QA-CHECKLIST.md)** as the execution spine; **[SYBNB-115-BUG-CHECKLIST.md](./SYBNB-115-BUG-CHECKLIST.md)** for regression bullets.

| Area | Minimum bar |
|------|-------------|
| **Listing creation** | Low-value anonymous path where allowed; high-value requires login + verification (`/api/listings/create`). |
| **Listing display** | Cloudinary-backed URLs (`next.config` `remotePatterns`); badges **جديد** (`isNewListing`), **موثوق** / verified seller (`isSellerVerifiedForListingTrust`), **إعلان موثوق** (`shouldShowTrustedListingBadge`). |
| **Contact** | Phone reveal + WhatsApp + on-platform messaging respect seller toggles + SYBNB-97 cooldowns. |
| **Share** | Listing URL `/{locale}/listing/{id}` + `hl_share` attribution (`ListingShareActions`). |
| **Report** | `POST /api/listings/[id]/report` persists rows; threshold hide via `SY8_REPORTS_THRESHOLD` / `applySy8ReportThresholds` (see QA checklist). |

---

## Phase 4 — Safety rules (enforced in code)

| Rule | Implementation |
|------|----------------|
| **≤ 3 anonymous listings / IP / UTC day** | `consumeAnonymousListingIpSlot` — max **3** (`anonymous-listing-ip-limit.ts`). |
| **≤ 10 listing inquiry messages / IP / UTC day** | `consumeListingMessageIpSlot` — max **10** (`listing-message-ip-limit.ts`). |
| **Flagged sellers** | Phone/WhatsApp UI suppressed where implemented (`ListingTrustPanel`, SYBNB-97); messaging-only funnel — verify on staging. |

*Multi-instance deploys should move counters to shared storage (Redis); comments note this.*

---

## Phase 5 — Performance lock

| Requirement | Where |
|-------------|--------|
| **Max 10 listings / page** | Browse search: `pageSize` capped at **10** (`search.service.ts`). Lite APIs: `clampSybnbLitePageSize` max **10**; `parsePagedListQuery` **`MAX_LIMIT`** **10** (`list-paging.ts`). Default browse constant `SYRIA_BROWSE_PAGE_SIZE_DEFAULT` **10** (`sybn104-performance.ts`). |
| **One image per card** | `SYBNB77_BROWSE_CARD_IMAGE_MAX = 1`; lite projection uses single `image`. |
| **Lazy / priority** | `SYRIA_CARD_PRIORITY_FIRST_COUNT`; gallery full weight only on `/listing/[id]` (`sybn104-performance.ts`). |
| **CDN only for listing photos** | Production expects HTTPS URLs in DB — dev-only data-URL fallback documented in `.env.example`; no base64 in prod paths. |
| **Payload budget** | Validate with Lighthouse / DevTools Network on `/buy` `/rent` — target initial HTML/JS discipline (no strict CI gate in repo). |

---

## Phase 6 — Trust system

| Signal | Rule |
|--------|------|
| **Verified (“موثوق”)** | `isSellerVerifiedForListingTrust`: listing/account/PKI seller verification — **not** only `verified === true`; see `listing-trust-badges.ts`. |
| **Trusted listing (“إعلان موثوق”)** | **`shouldShowTrustedListingBadge`:** seller verified **and** **≥ 3** photos **and** **≥ 2** normalized amenities **and** not fraud-flagged. |
| **Real-estate ownership tier** | `ownershipOwner` / mandate + phone match on account flows (`QuickPostForm`, persist paths). |

---

## Phase 7 — Contact control

- Seller channel toggles: phone / WhatsApp / email / messages (`persist-quick-listing`, listing UI).
- **Reveal:** phone hidden until explicit reveal where SYBNB-97 / config applies (`SYBNB_SHOW_PHONE`, trust panel).

---

## Phase 8 — Analytics (minimum viable storage)

Events wired via **`SyriaGrowthEvent`** / **`SybnbEvent`** patterns — verify:

| Event | Typical source |
|-------|----------------|
| `listing_view` | Listing detail + `/api/sybnb/events` path |
| `listing_shared` | Client `trackListingSharedClient` after WhatsApp / copy |
| `phone_reveal` | Trust panel / growth pipeline |
| `message_sent` | Listing contact message POST success |

*No dashboard required for FINAL acceptance — persistence + grep-able rows.*

---

## Phase 9 — Deployment check

- **`DATABASE_URL`** — Syria-dedicated DSN only (`docs/env-deployment.md`).
- **Cloudinary** — `CLOUDINARY_*`; folder isolation `CLOUDINARY_LISTINGS_FOLDER` default `sybnb/syria`.
- **Domain** — production host (e.g. **`syria.lecipm.com`**) in `NEXT_PUBLIC_SYRIA_APP_URL` / deployment settings.
- **Build:** `pnpm build:syria` (from repo root) **must pass**.

---

## Phase 10 — Code freeze

After FINAL sign-off:

- **No** new features or product logic changes.
- **Only** critical crash / sev-1 fixes.

---

## Final acceptance (sign-off)

- [ ] App loads acceptably on mobile.
- [ ] Listings create + view end-to-end.
- [ ] Contact paths safe and rate-limited.
- [ ] Trust badges behave per Phase 6.
- [ ] No uncaught crashes on smoke paths.
- [ ] No **`isTest`** rows intended for prod (cleaned or never created).
- [ ] Ready for real users.

---

## Related

- [SYBNB-114-QA-CHECKLIST.md](./SYBNB-114-QA-CHECKLIST.md)
- [SYBNB-115-BUG-CHECKLIST.md](./SYBNB-115-BUG-CHECKLIST.md)
- [SYBNB-116-VIRAL-GROWTH.md](./SYBNB-116-VIRAL-GROWTH.md)
- [env-deployment.md](./env-deployment.md)

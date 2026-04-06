# LECIPM — App Store & Google Play listing (ASO)

Paste into **App Store Connect** and **Google Play Console**. Tune per locale over time.

---

## Phase 1 — App name

**Primary (device + listing intent):**  
`LECIPM – Stays & Hotel Booking`

**If App Store Connect rejects length (often 30 characters max):**  
`LECIPM - Stays & Hotel Booking`  
(ASCII hyphen; counts as 30 characters.)

**Google Play:** title limit is higher; you may add a short differentiator if allowed in your region.

---

## Phase 2 — Subtitle (Apple) / Short description (Google)

**Apple — Subtitle (≤30 characters):**  
`Book stays & hotels instantly`

**Google Play — Short description (≤80 characters):**  
`Book short-term stays & hotels instantly. Apartments & travel stays.`

---

## Phase 3 — Keywords (Apple only; no spaces; comma-separated)

```
hotel,booking,rental,apartment,stays,travel,vacation,short stay,guest suite,trip
```

(≤100 characters for Apple’s keyword field; no spaces after commas.)

**Notes:** Avoid repeating words from the app name; refresh keywords after each release using Search Analytics.

---

## Phase 4 — Full description (structured)

Use the blocks below in order for the **long description** (Google Play) and **Description** (App Store).

### Hook

**Your stay, sorted.** LECIPM helps you book **short-term stays** and **hotel-style bookings** in fewer steps—whether you want an **apartment** for a week or a quick **travel stay**.

### Benefits

- **Faster booking** — see dates, price, and confirmation without juggling tabs.  
- **Clear status** — payment and confirmation updates stay in one place.  
- **Guest-first** — check details and host guidance when your trip is confirmed.  
- **Built for real trips** — designed for **short-term rental** and **hotel booking** flows, not generic travel clutter.

### Features

- Browse and book **stays** (listings vary by market).  
- Secure checkout with transparent totals.  
- **Booking confirmation** and status after payment.  
- Trip-oriented screens to review your reservation.  
- Optional travel add-ons where available (e.g. coverage partners).

### Call to action (CTA)

**Download LECIPM** and book your next **short-term stay** or **hotel** stay in minutes. Have feedback? Rate us on the store— it helps other travelers find **apartments** and **travel stays** they can trust.

---

## Phase 5 — Screenshots

**Generated marketing frames (with headline + subcopy):**  
Run from `apps/mobile`:

```bash
pnpm run store-screenshots:generate
```

Output: `assets/store-screenshots/` (6× PNG, **1290×2796** — common **6.7" iPhone** portrait size).  
**Replace** with real device captures when possible; keep **large readable type** and **one message per screen**.

**Suggested order / overlays (also encoded in the script):**

1. **Discover stays** — Browse apartments & short-term rentals  
2. **Book in minutes** — Secure checkout & clear totals  
3. **Stay confirmed** — Booking status you can trust  
4. **Trip-ready** — Details for your travel stays  
5. **Host guidance** — Check-in notes when available  
6. **Get LECIPM** — Book hotels & rentals — Download now  

**Play Console:** also upload **16:9** or **tablet** sets if you target those form factors.

---

## Phase 6 — App icon

- Use a **1024×1024** master with **no transparency** (Apple).  
- **Android adaptive:** safe zone ~66% center; avoid tiny text.  
- Regenerate placeholders: `pnpm run assets:generate` — **swap** for final brand artwork before scaling ads.

---

## Phase 7 — Reviews (in-app)

The app requests a **system review prompt** after a **confirmed / paid-like** booking on:

- **Payment success** (Stripe return), and  
- **Booking confirmation** when status is paid/completed.

Throttled to **about once per 90 days** per install (`SecureStore`). The OS may still limit how often the sheet appears.

---

## Phase 8 — Track performance

| Metric | Where |
|--------|--------|
| **Impressions, installs, conversion (listing → install)** | App Store Connect → Analytics; Play Console → Acquisition / Store analysis |
| **Retention (D1/D7)** | ASC cohorts; Play → Statistics → Retention |
| **Reviews & rating** | ASC / Play ratings breakdown; reply to reviews for ASO |
| **In-app funnel (optional)** | Soft-launch events via `/api/bnhub/events` when enabled |

**Cadence:** weekly review of install source, keyword buckets (Apple Search Ads / ASO), and crash rate before increasing ad spend.

---

## Support & legal (store forms)

- **Support URL:** `https://lecipm.com` (or dedicated `/support`)  
- **Privacy policy:** `https://lecipm.com/legal/privacy`  
- **Terms:** `https://lecipm.com/legal/terms`

---

## Reviewer notes (example)

Test account (provide real credentials in private ASC / Play fields):  
_— add email + password for a sandbox or staging user._  

The app requires network access; production API host should match store build `EXPO_PUBLIC_API_BASE_URL`.

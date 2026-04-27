# LECIPM — UI mockups (PNG), Figma interactions, and investor metrics

**Mockup set:** landing, listings feed, booking (with pricing), admin AI brain, broker campaigns, mobile flow, revenue analytics. Reference workspace asset: `assets/Screenshot_2026-04-26_at_1.28.45_AM-9f3dc384-a671-4b0c-86dc-824c2f90946c.png` (or latest PNG export in project assets). Presentation-ready, dark + gold + Inter.

---

## 1) Booking page — line items (aligns with `calculateTotal` + 10% fee)

**Under the subtotal, before total:**

- `N nights × $[price] = $[subtotal]`
- `Platform fee (10%) = $[fee]` (same as `platformFeeCentsFromSubtotal` / 100)
- Horizontal rule
- `Total = $[total]` (same as `totalWithPlatformFeeCents` → `finalCents` / 100)

**Code:** `apps/web/components/booking/PriceBreakdown.tsx` + `lib/pricing/calculateTotal.ts`.

**Checkout:** `POST /api/checkout` re-computes subtotal and fee on the server, validates `body.amount` against the server `finalCents`, and stores `{ subtotalCents, feeCents, finalCents, nights }` on the marketplace `Booking` (Order 65).

**Example (copy for Figma):**

```text
3 nights × $120 = $360
Platform fee (10%) = $36
─────────────────
Total = $396
```

---

## 2) Figma — clickable prototype (exact)

**Flow (frames):**  
Landing → Listings → Listing (detail) → Booking → Checkout → Confirmation → Trips

| From | Action | To |
|------|--------|-----|
| Landing | CTA `Explore Listings` | Listings (feed) |
| Listings | Click card | Listing detail |
| Listing | `Book now` | `/book/[id]` (booking with calendar) |
| Booking | Select dates (prototype updates price), `Book now` | Checkout (Stripe/Hosted mock) |
| Checkout | CTA (simulate pay) | Confirmation |
| Confirmation | e.g. `View trip` / `My trips` | Trips / upcoming stays |

**Interaction polish:** buttons subtle scale (e.g. 1.02) + gold glow, cards lift on hover, calendar selection updates the total (simulated in prototype). Transitions **200ms ease-in-out** (see `figma-product-ui-01-06.md`).

---

## 3) Investor-level metrics (connected to the engine)

**Definitions:**

| Metric | Definition |
|--------|------------|
| **GMV** | `SUM(finalCents) / 100` — guest-facing gross (stay + 10% platform line), confirmed bookings with snapshots |
| **Platform revenue (gross)** | `SUM(feeCents) / 100` — same rule as `platformFeeCentsFromSubtotal` |
| **Net platform revenue** | Fee less proportional effect of `refundedAmountCents` (fee × (1 − min(1, refund/final))) |
| **Nights** | `SUM(nights)` where set |
| **Average booking value** | `GMV / count` in major units |
| **Occupancy** | Per listing (booked day-nights / sellable) — not in the snapshot API; compute when inventory model is available |

**API (admin only):** `GET /api/admin/marketplace-investor-metrics`  
Optional: `?from=YYYY-MM-DD&to=YYYY-MM-DD` on booking `startDate`.

**Data path:** `Dates → calculateTotalPrice → totalWithPlatformFeeCents → Stripe amount → booking row (snapshots) → metrics → dashboard story.**

**Legacy rows:** Bookings before Order 65 may have null `finalCents` — they are excluded from money totals until backfilled (ledger still exists for ops).

---

## 4) Design tokens (from mockup)

- **Gold** `#D4AF37` · **Background** `#000000` · **Surface** `#111` · **Text** `#FFFFFF` / muted `#A3A3A3`
- **Radius** 16px · **Font** Inter

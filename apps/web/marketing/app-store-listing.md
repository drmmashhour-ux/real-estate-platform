# LECIPM — App Store & Google Play listing (draft)

Use this as the source of truth for store copy. Adjust per locale and platform character limits before submission.

---

## App name (≤ 30 characters on App Store)

**LECIPM – AI Real Estate**

Alternate if rejected: `LECIPM: Property Search` (ASCII, ≤ 30).

---

## Subtitle (iOS, ≤ 30 characters)

**Smart property search & verified listings**

---

## Short description (Google Play, ~80 characters)

**Find the right property faster with AI-powered search.**

---

## Promotional text (iOS, optional, ≤ 170 characters)

**Find the right property faster with AI-powered search.**

---

## Full description

**LECIPM** helps you discover homes, rentals, and short stays with **AI-powered search**, clear filters, and **verified listings** where available—so you can move from browsing to booking with confidence.

**Search smarter**  
Describe what you need in natural language or use advanced filters and map-friendly results to narrow options quickly.

**Trust & transparency**  
We focus on clarity: listing details, pricing signals where shown, and direct paths to contact owners or brokers when the platform allows it—**no hidden fees** called out in-app beyond what partners display at checkout.

**Speed**  
Get to the next step fast: save favorites, compare options, and complete BNHub stay bookings with secure checkout when enabled.

**AI insights**  
Optional AI-assisted summaries and ranking help you scan long descriptions and focus on what matters for your decision—**not** legal or financial advice; always verify with professionals for offers and contracts.

Whether you’re buying, renting, hosting, or booking a stay, LECIPM is built to reduce friction and help you **find the right property faster**.

**Privacy & terms**  
See in-app links to our Privacy Policy and Terms of Service. Location and notification permissions are requested only when a feature needs them.

---

## Keywords (iOS — comma-separated, no spaces, ~100 characters total; do not repeat app name)

```
real estate,property search,houses for sale,rent apartments,real estate app,home search,property finder,homes for rent,buy house,real estate AI,property listings,apartments near me,investment property,broker listings,real estate canada
```

---

## Google Play short / full

Reuse **short description** above for the short field; use **Full description** with light formatting allowed (no HTML if Play Console rejects—use plain text).

---

## Screenshots

- Generate marketing frames: `cd apps/web && pnpm screenshots:optimize` (WebP) / `pnpm screenshots:export` (PNG exports with dev server).
- Mobile generator: `cd apps/mobile && pnpm run store-screenshots:generate`.

---

## Support URL

`https://lecipm.com/help` (or your production help URL).

---

## Marketing URL

`https://lecipm.com`

---

## Copyright

`© LECIPM` (update year and legal entity as required).

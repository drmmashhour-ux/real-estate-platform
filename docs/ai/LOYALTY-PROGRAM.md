# BNHub loyalty program (LECIPM Manager)

Simple, deterministic guest rewards for repeat bookings on BNHub. There is **no points currency**, **no stacking** of loyalty discounts with other lodging promotions, and **past bookings are never rewritten**.

## Tier rules (by completed paid stays **before** the stay being priced)

| Completed stays | Tier   | Lodging discount (nightly subtotal) |
|-----------------|--------|--------------------------------------|
| 0               | NONE   | 0%                                   |
| 1               | BRONZE | 3%                                   |
| 2–3             | SILVER | 5%                                   |
| 4+              | GOLD   | 8%                                   |

Tiers are stored on `UserLoyaltyProfile` and recomputed after each qualifying payment (see below).

## Discount mechanics

- **Lodging only**: the percent applies to the **nightly subtotal** (before cleaning/taxes/service fee). Other line items are unchanged.
- **Single winner**: for each quote, the engine compares **loyalty % off lodging** vs **early-booking (and other pricing-rule) discounts** on the same base and applies **only the larger** lodging discount. This is `lodgingDiscountAppliedCents` with `lodgingDiscountSource` of `LOYALTY` or `EARLY_BOOKING`.
- **No manual stack**: if you add separate coupon or host manual lines in the future, keep the same “max of lodging discounts” rule unless product explicitly allows otherwise.

## When loyalty updates

After a BNHub booking is **paid** (Stripe webhook transitions payment from `PENDING` → `COMPLETED`), we:

1. Insert a **`LoyaltyRewardEvent`** keyed by `bookingId` (unique) for idempotency on webhook retries.
2. Increment `totalBookings` and `completedBookings`, set `lastBookingAt`, and set `tier` from the new completed count.

Retries that hit the unique constraint on `bookingId` **do not** double-count.

## Payments safety

- **Checkout amount** is derived from the same `computeBookingPricing` pipeline as the booking row / quote snapshot (guest id included when known).
- **Host payout** and **platform fee** in the pricing engine are computed from the **post-discount lodging subtotal** and add-ons; lowering the guest’s lodging price reduces what the host earns on that margin in a consistent way (same formulas, smaller base).
- **Stripe** charges the server-calculated total; the client does not set arbitrary cents for booking checkout.

## Promotions and “best discount”

Active listing promotions that flow through **pricing rules** (e.g. early booking) participate in the same **max** comparison as loyalty. There is **no additive stacking** of percent-off on the same lodging subtotal.

## AI / autopilot

- **Search ranking**: logged-in guests with a stored tier get a **small, explainable** score nudge (Bronze / Silver / Gold) in marketplace sort — it does **not** change prices.
- **Conversion signals**: funnel events may include loyalty context in metadata where useful; autopilot must **not** grant extra discounts beyond the pricing engine.

## Logging

Structured logs on checkout creation when loyalty wins:

- `userId`, `bookingId`, `tier`, `discountPercent`, `appliedAt`

Webhook logs when loyalty credit is applied after payment.

## Future upgrades

- Optional **per-market caps** on loyalty percent.
- **Expiry** of tier if no travel in N months (would require policy + migrations).
- **Host-opt-in** boosted loyalty campaigns with separate budget (still single winner vs other rules).

# Lead monetization control layer

Operator/admin readout that **unifies** the revenue-engine **base price**, **lead quality** advisory, **demand**, **broker interest**, and **dynamic pricing** into one explanation bundle. It does **not** change Stripe, checkout, submission flows, or `computeLeadValueAndPrice` internals.

## What it does

- Shows a single **suggested price (advisory)** with a clear **price source mode**:
  - **`dynamic_advisory`** — primary when the dynamic pricing layer produced a suggestion (quality score feeds that layer when enabled).
  - **`quality_advisory`** — when dynamic pricing is off or unavailable but lead quality V1 ran.
  - **`base_only`** — when only the revenue engine anchor is available as the unified figure.
- Surfaces **base price** always as the reference from existing pricing rules.
- Emits **confidence** (`low` | `medium` | `high`) from signal richness — not a sales guarantee.
- Lists **missing / thin signals** when confidence is low (no fabricated certainty).

## What confidence means

- **Low**: Few layers or sparse engagement — prefer conservative positioning.
- **Medium**: Default when some signals exist but not enough for a strong read.
- **High**: Multiple aligned signals (e.g. quality + dynamic + richer demand/broker context) — still **advisory**, not a promise.

## What the system does **not** do

- Does not write prices to Stripe or override checkout amounts.
- Does not auto-apply suggested prices to buyers or brokers.
- Does not replace legal/commercial quoting — wording stays **advisory**.

## Why advisory wording matters

Unlock and monetization copy must not read as a firm quote or guaranteed ROI. The UI uses phrases like **“Suggested price (advisory)”** and **“Base price”** so operators align external messaging with platform-safe framing.

## Feature flag

`FEATURE_LEAD_MONETIZATION_CONTROL_V1` — when on, **admins** receive `leadMonetizationControlV1` on `GET /api/leads/[id]` and see **Lead monetization control** on the lead detail page.

## Pricing mode precedence (exact)

1. **`dynamic_advisory`** — used when `FEATURE_DYNAMIC_PRICING_V1` is on and `computeDynamicLeadPrice` returns a suggestion. This becomes the **primary advisory suggested price** for the unified readout.
2. **`quality_advisory`** — used when dynamic pricing is **absent** but `FEATURE_LEAD_QUALITY_V1` produced a quality summary; suggested price comes from **quality’s** advisory figure.
3. **`base_only`** — neither layer produced a usable advisory figure; **suggested price equals** the revenue-engine **base** from `computeLeadValueAndPrice` (same engine as before — not altered by this layer).

The control layer **never** mutates `computeLeadValueAndPrice`; it only **selects which number** to highlight as “Suggested price (advisory)”.

## Confidence rules (exact)

Signal **richness** (0–100) combines presence of quality + dynamic layers, demand score, broker-interest proxy, interactions, region peers, and conversion probability when present.

- **Low** if richness **&lt; 38** OR alignment count **≤ 1** (alignment = quality present, dynamic present, demand ≥ 55, broker interest ≥ 55).
- **High** if richness **≥ 72** AND alignment **≥ 3** AND dynamic pricing **is** present.
- Otherwise **medium**.

Missing-signal strings list what was not run or thin (e.g. no interactions, no conversion probability).

## Monitoring

In-process counters and **console** logs prefixed with `[lead:monetization-control]` (see `lead-monetization-control-monitoring.service.ts`).

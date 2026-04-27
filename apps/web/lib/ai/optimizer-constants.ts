/** Max absolute % change (e.g. 0.2 = 20%) applied in one optimization step. */
export const PRICING_MAX_CHANGE = 0.2;

/** Bounds in **major currency units** (e.g. dollars) for suggested nightly price. */
export const PRICING_MIN_PRICE_MAJOR = 50;
export const PRICING_MAX_PRICE_MAJOR = 5000;

export const PRICING_MIN_PRICE_CENTS = Math.round(PRICING_MIN_PRICE_MAJOR * 100);
export const PRICING_MAX_PRICE_CENTS = Math.round(PRICING_MAX_PRICE_MAJOR * 100);

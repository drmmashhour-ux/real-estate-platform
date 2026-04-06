/**
 * Display-only price hints for unlock / conversion CTAs (actual checkout uses Stripe metadata).
 * Range: ~$5–15 USD as env cents; defaults mid-range.
 */
export function getListingContactUnlockDisplayCents(): { min: number; max: number; default: number } {
  const min = parseInt(process.env.NEXT_PUBLIC_LISTING_UNLOCK_MIN_CENTS ?? "500", 10);
  const max = parseInt(process.env.NEXT_PUBLIC_LISTING_UNLOCK_MAX_CENTS ?? "1500", 10);
  const def = parseInt(process.env.NEXT_PUBLIC_LISTING_UNLOCK_DEFAULT_CENTS ?? "999", 10);
  return {
    min: Number.isFinite(min) ? min : 500,
    max: Number.isFinite(max) ? max : 1500,
    default: Number.isFinite(def) ? def : 999,
  };
}

export function formatUnlockPriceShort(): string {
  const { min, max } = getListingContactUnlockDisplayCents();
  const a = (min / 100).toFixed(0);
  const b = (max / 100).toFixed(0);
  return `$${a}–$${b}`;
}

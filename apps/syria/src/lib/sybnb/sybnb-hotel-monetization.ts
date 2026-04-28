/**
 * SYBNB-41 — Hotel subscription positioning (manual ops; USD bands for copy only).
 */

export type SybnbHotelSubscriptionUsdBand = { min: number; max: number };

/** Monthly subscription band communicated to hotel partners ($20–$100 by visibility tier). */
export function getSybnbHotelSubscriptionUsdBand(): SybnbHotelSubscriptionUsdBand {
  const minRaw = process.env.NEXT_PUBLIC_SYBNB_HOTEL_SUB_USD_MIN ?? "20";
  const maxRaw = process.env.NEXT_PUBLIC_SYBNB_HOTEL_SUB_USD_MAX ?? "100";
  const min = Number(minRaw);
  const max = Number(maxRaw);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min) {
    return { min: 20, max: 100 };
  }
  return { min: Math.floor(min), max: Math.floor(max) };
}

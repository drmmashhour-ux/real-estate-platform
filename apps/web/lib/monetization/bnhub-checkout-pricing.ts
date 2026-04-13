/**
 * BNHUB guest checkout: dynamic service fee (base + peak) and optional upsells.
 * Enable itemized Stripe lines + webhook v2 validation with BNHUB_CHECKOUT_ITEMIZED_FEES=1.
 */

export type BnhubUpsellSelection = {
  insurance?: boolean;
  earlyCheckIn?: boolean;
  lateCheckOut?: boolean;
};

export function isBnhubItemizedCheckoutEnabled(): boolean {
  return process.env.BNHUB_CHECKOUT_ITEMIZED_FEES?.trim() === "1";
}

/** Count stay nights that fall on Fri/Sat/Sun UTC (simple peak proxy). */
export function countPeakNightsFromBookingDates(dates: unknown): { peakNights: number; totalNights: number } {
  if (!Array.isArray(dates) || dates.length === 0) {
    return { peakNights: 0, totalNights: 1 };
  }
  let peak = 0;
  for (const d of dates) {
    if (typeof d !== "string" || !d.trim()) continue;
    const dt = new Date(`${d.trim()}T12:00:00.000Z`);
    if (Number.isNaN(dt.getTime())) continue;
    const day = dt.getUTCDay();
    if (day === 5 || day === 6 || day === 0) peak += 1;
  }
  return { peakNights: peak, totalNights: Math.max(1, dates.length) };
}

export function computeBnhubGuestCheckoutCents(input: {
  accommodationCents: number;
  dates?: unknown;
  upsells?: BnhubUpsellSelection;
}): {
  accommodationCents: number;
  baseFeeCents: number;
  peakFeeCents: number;
  serviceFeeTotalCents: number;
  upsellCents: { insurance: number; earlyCheckIn: number; lateCheckOut: number };
  totalCents: number;
} {
  const baseBps = Math.max(0, Number(process.env.BNHUB_SERVICE_FEE_BASE_BPS ?? "800"));
  const peakExtraBps = Math.max(0, Number(process.env.BNHUB_SERVICE_FEE_PEAK_EXTRA_BPS ?? "200"));
  const { peakNights, totalNights } = countPeakNightsFromBookingDates(input.dates ?? null);
  const peakRatio = peakNights / totalNights;

  const accommodation = Math.max(0, Math.round(input.accommodationCents));
  const baseFeeCents = Math.round((accommodation * baseBps) / 10000);
  const peakFeeCents = Math.round((accommodation * peakExtraBps * peakRatio) / 10000);
  const serviceFeeTotalCents = baseFeeCents + peakFeeCents;

  const ins = Math.max(0, Number(process.env.BNHUB_UPSELL_INSURANCE_CENTS ?? "1999"));
  const early = Math.max(0, Number(process.env.BNHUB_UPSELL_EARLY_CHECKIN_CENTS ?? "2500"));
  const late = Math.max(0, Number(process.env.BNHUB_UPSELL_LATE_CHECKOUT_CENTS ?? "2500"));
  const u = input.upsells ?? {};
  const upsellCents = {
    insurance: u.insurance ? ins : 0,
    earlyCheckIn: u.earlyCheckIn ? early : 0,
    lateCheckOut: u.lateCheckOut ? late : 0,
  };
  const upsellSum = upsellCents.insurance + upsellCents.earlyCheckIn + upsellCents.lateCheckOut;
  const totalCents = accommodation + serviceFeeTotalCents + upsellSum;

  return {
    accommodationCents: accommodation,
    baseFeeCents,
    peakFeeCents,
    serviceFeeTotalCents,
    upsellCents,
    totalCents,
  };
}

export function parseUpsellsFromBody(body: unknown): BnhubUpsellSelection | undefined {
  if (!body || typeof body !== "object") return undefined;
  const root = body as Record<string, unknown>;
  const u = root.upsells;
  if (!u || typeof u !== "object") return undefined;
  const o = u as Record<string, unknown>;
  return {
    insurance: o.insurance === true,
    earlyCheckIn: o.earlyCheckIn === true || o.early_check_in === true,
    lateCheckOut: o.lateCheckOut === true || o.late_check_out === true,
  };
}

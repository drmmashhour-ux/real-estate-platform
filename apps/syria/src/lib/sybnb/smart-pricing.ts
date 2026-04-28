/**
 * SYBNB-14 Smart pricing — reference USD nightly bands + “excellent deal” detection for badges.
 *
 * Conversion: set `SYBNB_SMART_PRICING_SYP_PER_USD` to approximate Syrian Pounds **per one USD**
 * (e.g. 13000 ⇒ $1 ≈ 13,000 SYP). Used only for USD band labeling / budget-deal heuristic.
 *
 * Operational guidance (outside code): launch slightly under market; favour bookings over margin
 * for the first ~10 bookings; then raise ~10–20% when traction warrants it.
 */

/** Reference tiers in USD/night — for guidance and cheap-deal heuristics only. */
export const SYBNB_USD_REF_BANDS = {
  budget: { min: 10, max: 20 },
  mid: { min: 20, max: 50 },
  premium: { min: 50, max: 120 },
} as const;

function parsePositiveFloat(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const n = Number.parseFloat(raw.trim());
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

/** SYP (or listing currency minor units treated as integer SYP-style) units per **one USD**. */
export function sybnbSypPerUsdFromEnv(): number | null {
  const raw = process.env.SYBNB_SMART_PRICING_SYP_PER_USD?.trim();
  if (!raw) return null;
  const n = Number.parseFloat(raw.replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** Nightly listing price as a positive number (`pricePerNight` or fallback `price` string). */
export function sybnbEffectiveNightly(listing: { pricePerNight: number | null; price: string }): number | null {
  return listing.pricePerNight != null ? listing.pricePerNight : parsePositiveFloat(listing.price);
}

export function sybnbNightlyUsdApprox(nightly: number, currency: string): number | null {
  const cu = currency.trim().toUpperCase();
  if (cu === "USD") return nightly;
  const rate = sybnbSypPerUsdFromEnv();
  if (rate == null) return null;
  if (cu === "SYP") return nightly / rate;
  return null;
}

export type SybnbUsdBand = keyof typeof SYBNB_USD_REF_BANDS;

/** Returns which reference band a nightly USD falls into, when inside [$10,$120]; else null. */
export function sybnbUsdNightBand(usdPerNight: number): SybnbUsdBand | null {
  const { budget, mid, premium } = SYBNB_USD_REF_BANDS;
  if (usdPerNight >= budget.min && usdPerNight < budget.max) return "budget";
  if (usdPerNight >= mid.min && usdPerNight < mid.max) return "mid";
  if (usdPerNight >= premium.min && usdPerNight <= premium.max) return "premium";
  return null;
}

export type DealBatchRow = {
  id: string;
  state: string | null | undefined;
  governorate: string | null | undefined;
  pricePerNight: number | null;
  price: string;
  currency: string;
  images: unknown;
  verified?: boolean;
  listingVerified?: boolean;
};

/**
 * “Excellent deal / عرض ممتاز”: cheapest quartile among same governorate/state in this batch **or**
 * budget-band USD nightly (when FX env set) plus basic quality (photos + trust).
 */
export function computeSybnbExcellentDealFlags(rows: DealBatchRow[]): Map<string, boolean> {
  const out = new Map<string, boolean>();
  if (rows.length === 0) return out;

  const cohortKey = (r: DealBatchRow) => {
    const s = typeof r.state === "string" ? r.state.trim() : "";
    const g = typeof r.governorate === "string" ? r.governorate.trim() : "";
    return s || g || "__national__";
  };

  type Row = DealBatchRow & { nightly: number };
  const withNightly: Row[] = [];
  for (const r of rows) {
    const nightly = sybnbEffectiveNightly(r);
    if (nightly == null || !(nightly > 0)) continue;
    withNightly.push({ ...r, nightly });
  }
  if (withNightly.length === 0) return out;

  const byCohort = new Map<string, Row[]>();
  for (const r of withNightly) {
    const k = cohortKey(r);
    const prev = byCohort.get(k);
    if (prev) prev.push(r);
    else byCohort.set(k, [r]);
  }

  function imageCount(im: unknown): number {
    if (!Array.isArray(im)) return 0;
    return im.filter((x): x is string => typeof x === "string" && x.length > 0).length;
  }

  for (const cohort of byCohort.values()) {
    const sorted = [...cohort].sort((a, b) => a.nightly - b.nightly);
    const k = Math.max(1, Math.ceil(sorted.length * 0.25));
    const cheapestQuartile = new Set(sorted.slice(0, k).map((r) => r.id));
    for (const id of cheapestQuartile) {
      out.set(id, true);
    }
  }

  const fx = sybnbSypPerUsdFromEnv();
  if (fx != null) {
    for (const r of withNightly) {
      const usd = sybnbNightlyUsdApprox(r.nightly, r.currency);
      if (usd == null) continue;
      const inBudget =
        usd >= SYBNB_USD_REF_BANDS.budget.min && usd < SYBNB_USD_REF_BANDS.budget.max;
      const imgs = imageCount(r.images);
      const trust = Boolean(r.verified ?? r.listingVerified);
      if (inBudget && imgs >= 3 && trust) {
        out.set(r.id, true);
      }
    }
  }

  return out;
}

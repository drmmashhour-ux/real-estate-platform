import { normLog } from "@/lib/ranking/normalize-metrics";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function cityNeighborhoodScore(
  anchorCity: string,
  anchorRegion: string | null | undefined,
  candCity: string,
  candRegion: string | null | undefined
): number {
  const ac = anchorCity.trim().toLowerCase();
  const cc = candCity.trim().toLowerCase();
  if (ac === cc) {
    const ar = (anchorRegion ?? "").trim().toLowerCase();
    const cr = (candRegion ?? "").trim().toLowerCase();
    if (!ar && !cr) return 1;
    if (ar && cr && (ar === cr || ar.includes(cr) || cr.includes(ar))) return 1;
    return 0.92;
  }
  if (ac.includes(cc) || cc.includes(ac)) return 0.78;
  return 0.35;
}

export function priceProximityScore(anchorCents: number, candCents: number, margin = 0.4): number {
  if (anchorCents <= 0 || candCents <= 0) return 0.55;
  const lo = anchorCents * (1 - margin);
  const hi = anchorCents * (1 + margin);
  if (candCents >= lo && candCents <= hi) return 1;
  const ratio = candCents / anchorCents;
  const dev = Math.abs(Math.log(Math.max(0.05, ratio)));
  return clamp01(1 - Math.min(1, dev / Math.log(4)));
}

export function typeMatchScore(a: string | null | undefined, b: string | null | undefined): number {
  const x = (a ?? "").trim().toLowerCase();
  const y = (b ?? "").trim().toLowerCase();
  if (!x || !y) return 0.65;
  if (x === y) return 1;
  if (x.includes(y) || y.includes(x)) return 0.85;
  return 0.45;
}

export function guestBedroomScore(anchorGuests: number, candGuests: number, anchorBeds: number, candBeds: number): number {
  const g =
    anchorGuests <= 0 || candGuests <= 0
      ? 0.7
      : 1 - Math.min(1, Math.abs(anchorGuests - candGuests) / Math.max(1, anchorGuests, candGuests));
  const b =
    anchorBeds <= 0 || candBeds <= 0
      ? 0.7
      : 1 - Math.min(1, Math.abs(anchorBeds - candBeds) / Math.max(1, anchorBeds, candBeds, 4));
  return clamp01(0.55 * g + 0.45 * b);
}

export function amenityJaccard(a: string[], b: string[]): number {
  const A = new Set(a.map((x) => x.trim().toLowerCase()).filter(Boolean));
  const B = new Set(b.map((x) => x.trim().toLowerCase()).filter(Boolean));
  if (A.size === 0 && B.size === 0) return 0.75;
  let inter = 0;
  for (const x of A) {
    if (B.has(x)) inter++;
  }
  const union = A.size + B.size - inter;
  return union <= 0 ? 0 : inter / union;
}

export function listingQuality01(args: {
  reviewCount: number;
  photoCount: number;
}): number {
  const r = normLog(args.reviewCount, 40);
  const p = normLog(args.photoCount, 12);
  return clamp01(0.45 * r + 0.55 * p);
}

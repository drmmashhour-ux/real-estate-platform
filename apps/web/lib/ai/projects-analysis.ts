/**
 * Lightweight client-side project score (0–100) for dashboard ranking.
 * No network or Prisma — deterministic heuristics only.
 */

type ProjectLike = {
  name?: string;
  city?: string;
  status?: string;
  startingPrice?: number;
  deliveryDate?: string;
};

type UnitLike = { status?: string; price?: number };

function parseDeliveryMs(raw: string | undefined): number | null {
  if (!raw) return null;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : null;
}

export function analyzeProject(project: ProjectLike, units: UnitLike[]): { score: number } {
  const total = units.length > 0 ? units.length : 1;
  const soldOrReserved = units.filter((u) => {
    const s = (u.status ?? "").toLowerCase();
    return s.includes("sold") || s.includes("reserved") || s.includes("booked");
  }).length;
  const availabilityRatio = 1 - soldOrReserved / total;

  const delivery = parseDeliveryMs(project.deliveryDate);
  const now = Date.now();
  const monthsToDelivery =
    delivery != null ? Math.max(0, (delivery - now) / (1000 * 60 * 60 * 24 * 30)) : 12;

  const status = (project.status ?? "").toLowerCase();
  let statusBoost = 0;
  if (status.includes("launch") || status.includes("new")) statusBoost = 8;
  if (status.includes("completed") || status.includes("delivered")) statusBoost = -5;

  const price = project.startingPrice ?? 0;
  const priceBand = price > 0 ? Math.min(25, Math.log10(price + 1) * 6) : 10;

  let score =
    42 +
    availabilityRatio * 28 +
    Math.min(22, monthsToDelivery * 1.4) +
    priceBand * 0.35 +
    statusBoost;

  score = Math.round(Math.min(100, Math.max(0, score)));
  return { score };
}

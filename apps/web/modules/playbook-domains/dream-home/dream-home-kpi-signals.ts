/**
 * Dream Home KPI: explicit engagement + conversion signals only. No protected-trait or demographic inference.
 */
function clamp01(x: number): number {
  if (!Number.isFinite(x)) {
    return 0;
  }
  return Math.max(0, Math.min(1, x));
}

export type DreamHomeKpiInput = {
  /** Raw bandit/assignment outcome fields if present. */
  realizedValue?: number;
  realizedRevenue?: number;
  realizedConversion?: number;
  riskScore?: number;
  /** Explicit product signals (when logged). */
  listingSave?: number;
  shortlistAdd?: number;
  detailViewDepth?: number; // 0-1 normalized depth
  inquirySubmit?: number; // 0-1
  bookedVisit?: number; // 0-1
};

const WEIGHTS = {
  value: 0.22,
  revenue: 0.22,
  conversion: 0.22,
  save: 0.12,
  shortlist: 0.1,
  depth: 0.04,
  inquiry: 0.1,
  visit: 0.1,
} as const;

/**
 * Core reward: weighted blend of value/revenue/conversion and explicit interaction signals. Risk sublinear reduction.
 */
export function computeDreamHomeKpiCore(input: DreamHomeKpiInput): number {
  const v = clamp01(input.realizedValue ?? 0);
  const r = clamp01(input.realizedRevenue ?? 0);
  const c = clamp01(input.realizedConversion ?? 0);
  const s = clamp01(input.listingSave ?? 0);
  const sh = clamp01(input.shortlistAdd ?? 0);
  const d = clamp01(input.detailViewDepth ?? 0);
  const inq = clamp01(input.inquirySubmit ?? 0);
  const vis = clamp01(input.bookedVisit ?? 0);
  const risk = clamp01(input.riskScore ?? 0);
  const raw =
    WEIGHTS.value * v +
    WEIGHTS.revenue * r +
    WEIGHTS.conversion * c +
    WEIGHTS.save * s +
    WEIGHTS.shortlist * sh +
    WEIGHTS.depth * d +
    WEIGHTS.inquiry * inq +
    WEIGHTS.visit * vis;
  if (!Number.isFinite(raw)) {
    return 0;
  }
  const riskMultiplier = 1 - 0.35 * Math.sqrt(risk);
  return Math.max(0, Math.min(1, raw * riskMultiplier));
}

/**
 * Public API: deterministic reward from explicit signals and optional bandit fields.
 */
export function computeDreamHomeReward(params: DreamHomeKpiInput): number | null {
  const v = params.realizedValue;
  const r = params.realizedRevenue;
  const c = params.realizedConversion;
  const hasBandit = [v, r, c].some(
    (x) => x !== undefined && x !== null && Number.isFinite(Number(x)),
  );
  const hasSignals =
    [params.listingSave, params.shortlistAdd, params.detailViewDepth, params.inquirySubmit, params.bookedVisit].some(
      (x) => x !== undefined && x !== null && Number.isFinite(Number(x)) && Number(x) > 0,
    );
  if (!hasBandit && !hasSignals) {
    return null;
  }
  return computeDreamHomeKpiCore({
    ...params,
    realizedValue: hasBandit ? clamp01(Number(v ?? 0)) : 0,
    realizedRevenue: hasBandit ? clamp01(Number(r ?? 0)) : 0,
    realizedConversion: hasBandit ? clamp01(Number(c ?? 0)) : 0,
  });
}

/**
 * Deterministic demand level from observable lead signals — safe when fields are missing (treated as 0).
 */

export type LeadDemandSignals = {
  /** CRM touches + timeline events (or similar engagement count). */
  interactionCount: number;
  engagementScore: number;
  highIntent: boolean;
  /** 0–1 when set on the lead row. */
  conversionProbability?: number | null;
  /** Optional: durable or inferred lead detail views. */
  leadViewCount?: number;
  /** Optional: checkout attempts / unlock funnel touches (when tracked). */
  unlockAttemptCount?: number;
  /** Optional: strong routing candidates (good/strong fit) for this lead. */
  routingFitCandidateCount?: number;
  /** Optional: other leads in the same city/region in the current snapshot or window (competition for attention). */
  regionPeerLeadCount?: number;
};

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Raw 0–100 demand score → low / medium / high (deterministic thresholds).
 */
export function computeLeadDemandScore(signals: LeadDemandSignals): number {
  const ic = Math.max(0, signals.interactionCount);
  const es = clamp(typeof signals.engagementScore === "number" ? signals.engagementScore : 0, 0, 100);
  const conv =
    signals.conversionProbability != null && Number.isFinite(signals.conversionProbability)
      ? clamp(signals.conversionProbability, 0, 1)
      : 0;

  let r = 0;
  r += Math.min(28, ic * 3.5);
  r += Math.min(22, es * 0.22);
  r += signals.highIntent ? 12 : 0;
  r += Math.min(18, conv * 18);
  r += Math.min(12, Math.max(0, signals.leadViewCount ?? 0) * 4);
  r += Math.min(16, Math.max(0, signals.unlockAttemptCount ?? 0) * 8);
  r += Math.min(14, Math.max(0, signals.routingFitCandidateCount ?? 0) * 3.5);
  r += Math.min(15, Math.max(0, signals.regionPeerLeadCount ?? 0) * 4);

  return Math.round(clamp(r, 0, 100));
}

export function computeLeadDemandLevel(signals: LeadDemandSignals): "low" | "medium" | "high" {
  const s = computeLeadDemandScore(signals);
  if (s >= 68) return "high";
  if (s >= 38) return "medium";
  return "low";
}

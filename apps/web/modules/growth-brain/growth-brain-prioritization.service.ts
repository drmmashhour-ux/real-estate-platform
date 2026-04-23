import { DEFAULT_PRIORITIZATION_WEIGHTS, domainStrategicFit } from "./growth-brain.config";
import type { NormalizedSignal, GrowthOpportunity } from "./growth-brain.types";
const SEVERITY_URGENCY: Record<NormalizedSignal["severity"], number> = {
  critical: 0.95,
  important: 0.75,
  watch: 0.5,
  info: 0.3,
};

function categoryFor(s: NormalizedSignal): string {
  return s.signalType.replace(/_/g, " ");
}

function whyNow(s: NormalizedSignal): string {
  return `${s.title} — ${s.summary.slice(0, 200)}`;
}

function easeFor(s: NormalizedSignal): number {
  if (s.domain === "MARKETING" && s.signalType.includes("CONTENT")) return 0.75;
  if (s.domain === "SALES" && s.signalType.includes("PIPELINE")) return 0.45;
  if (s.domain === "BNHUB") return 0.5;
  return 0.55;
}

/**
 * Ranks opportunities: revenue upside, urgency, confidence, ease, strategic fit.
 */
export function prioritizeOpportunities(
  signals: NormalizedSignal[]
): GrowthOpportunity[] {
  const w = DEFAULT_PRIORITIZATION_WEIGHTS;
  const out: GrowthOpportunity[] = [];

  for (const s of signals) {
    const revenueUpside = s.expectedImpact;
    const urgency = SEVERITY_URGENCY[s.severity] ?? 0.5;
    const confidence = s.confidence;
    const easeOfExecution = easeFor(s);
    const strategicFit = domainStrategicFit(s.domain);

    const priorityScore =
      w.revenueUpside * revenueUpside +
      w.urgency * urgency +
      w.confidence * confidence +
      w.easeOfExecution * easeOfExecution +
      w.strategicFit * strategicFit;

    out.push({
      id: `opp-${s.signalId}`,
      title: s.title,
      category: categoryFor(s),
      whyNow: whyNow(s),
      expectedImpact: revenueUpside,
      urgency,
      confidence,
      easeOfExecution,
      strategicFit,
      priorityScore: Math.max(0, Math.min(1, priorityScore / 1.2)),
      domain: s.domain,
      sourceSignalIds: [s.signalId],
      region: s.region,
    });
  }

  return out.sort((a, b) => b.priorityScore - a.priorityScore);
}

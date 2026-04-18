import type { AutopilotV2ActionPayload } from "./autopilot.types";
import { getBoundedPatternMultipliers } from "./autopilot.learning";

/** Raised vs v1 to cut borderline / low-EV noise in the pending queue. */
const MIN_CONFIDENCE = 0.48;
/** Drop tiny EV ties (e.g. duplicate trigger families). */
const MIN_EV = 0.012;
const MAX_SUGGESTIONS_PER_RUN = 3;

function appendPriorityExplanation(p: AutopilotV2ActionPayload, ev: number, weight: number): AutopilotV2ActionPayload {
  const rankLine = `Ranked by expected value ${(ev * 100).toFixed(1)} (confidence × bounded impact × pattern weight ${weight.toFixed(2)}).`;
  return { ...p, explanation: p.explanation.includes(rankLine) ? p.explanation : [...p.explanation, rankLine] };
}

/**
 * Drops noisy suggestions, applies bounded learning multipliers, sorts by expected value.
 */
export async function prioritizeSuggestions(payloads: AutopilotV2ActionPayload[]): Promise<AutopilotV2ActionPayload[]> {
  if (payloads.length === 0) return [];
  const mult = await getBoundedPatternMultipliers();
  const scored = payloads
    .filter((p) => p.confidence >= MIN_CONFIDENCE)
    .map((p) => {
      const w = mult[p.type] ?? 1;
      const cappedImpact = Math.min(0.22, p.impactEstimate);
      const ev = p.confidence * cappedImpact * w;
      return { p, ev, w };
    })
    .filter((x) => x.ev >= MIN_EV)
    .sort((a, b) => b.ev - a.ev);
  const seen = new Set<string>();
  const out: AutopilotV2ActionPayload[] = [];
  for (const { p, ev, w } of scored) {
    if (seen.has(p.type)) continue;
    seen.add(p.type);
    out.push(appendPriorityExplanation(p, ev, w));
    if (out.length >= MAX_SUGGESTIONS_PER_RUN) break;
  }
  return out;
}

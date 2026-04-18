/**
 * Rule-based lead score 0–100 from attribution (not ML). Transparent heuristics.
 */
export type AttributionInput = {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  leadSource?: string | null;
};

export function scoreLeadSource(input: AttributionInput): number {
  let s = 40;
  const src = (input.source ?? "").toLowerCase();
  const med = (input.medium ?? "").toLowerCase();
  if (src.includes("google") || med.includes("cpc")) s += 15;
  if (src.includes("organic") || med.includes("organic")) s += 10;
  if (input.campaign) s += 5;
  if ((input.leadSource ?? "").includes("referral")) s += 12;
  if ((input.leadSource ?? "").includes("listing")) s += 8;
  return Math.min(100, Math.max(0, s));
}

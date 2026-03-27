import { dealAnalyzerConfig } from "@/config/dealAnalyzer";

export function computeOfferRangeCents(args: {
  askCents: number;
  compConfidence: "low" | "medium" | "high" | null;
  posture: "aggressive" | "balanced" | "cautious" | "insufficient_data";
}): { min: number | null; target: number | null; max: number | null } {
  const cfg = dealAnalyzerConfig.phase3.offer;
  if (args.askCents <= 0 || args.posture === "insufficient_data") {
    return { min: null, target: null, max: null };
  }

  let minPct = cfg.minPctOfAsk;
  let targetPct = cfg.targetPctOfAsk;
  let maxPct = cfg.maxPctOfAsk;

  if (args.compConfidence === "low") {
    const w = cfg.weakCompBandWiden;
    minPct -= w;
    targetPct -= w * 0.5;
    maxPct += w;
  }

  if (args.posture === "cautious") {
    minPct = Math.min(minPct, cfg.lowTrustMinPct);
    targetPct -= 0.04;
    maxPct -= 0.02;
  } else if (args.posture === "aggressive") {
    minPct += 0.02;
    targetPct += 0.01;
    maxPct += 0.01;
  }

  return {
    min: Math.round(args.askCents * minPct),
    target: Math.round(args.askCents * targetPct),
    max: Math.round(args.askCents * maxPct),
  };
}

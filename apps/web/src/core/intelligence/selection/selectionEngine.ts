import type { IntelligenceScores, SelectionItem } from "@/src/core/intelligence/types/intelligence.types";

export function selectBestActionsFromScores(id: string, scores: IntelligenceScores): SelectionItem[] {
  const reasons: string[] = [];
  let action = "analyze_more";
  if (scores.riskScore >= 75 || scores.trustScore < 45) {
    action = "verify_documents";
    reasons.push("Risk/trust threshold triggered deterministic verification gate");
  } else if (scores.dealScore >= 78 && scores.confidenceScore >= 60) {
    action = "contact_now";
    reasons.push("High deal and confidence scores");
  } else if (scores.dealScore < 40) {
    action = "ignore";
    reasons.push("Low relative opportunity score");
  } else if (scores.dealScore < 55) {
    action = "wait";
    reasons.push("Signal quality is not yet strong enough");
  } else {
    reasons.push("Mixed signals require deeper analysis");
  }
  return [{ id: `${id}:action`, type: "action", score: scores.dealScore, confidence: scores.confidenceScore, reasons, recommendedAction: action }];
}

export function selectBestStrategiesFromScores(id: string, scores: IntelligenceScores, bnhubFit: number): SelectionItem[] {
  const candidates = [
    { recommendedAction: "rent", score: Math.round(scores.dealScore * 0.6 + (100 - scores.riskScore) * 0.4), reason: "Cashflow-first deterministic blend" },
    { recommendedAction: "flip", score: Math.round(scores.dealScore * 0.7 + scores.trustScore * 0.3), reason: "Upside with trust support" },
    { recommendedAction: "bnhub", score: Math.round(bnhubFit * 0.6 + scores.dealScore * 0.4), reason: "Short-term-rental fit and score" },
    { recommendedAction: "live", score: Math.round(scores.trustScore * 0.6 + (100 - scores.riskScore) * 0.4), reason: "Safety-oriented profile" },
    { recommendedAction: "avoid", score: Math.round(scores.riskScore * 0.7 + (100 - scores.dealScore) * 0.3), reason: "Risk concentration dominates upside" },
  ];
  const top = candidates.sort((a, b) => b.score - a.score)[0];
  return [{ id: `${id}:strategy`, type: "strategy", score: top.score, confidence: scores.confidenceScore, reasons: [top.reason], recommendedAction: top.recommendedAction }];
}

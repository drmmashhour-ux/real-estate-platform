import type { HostPerformanceInput, HostPerformanceOutput } from "../models/agents.js";

export function runHostPerformanceAgent(input: HostPerformanceInput): HostPerformanceOutput {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const improvementRecommendations: string[] = [];
  let score = 75;

  const responseHours = input.responseTimeHours ?? 24;
  if (responseHours <= 2) {
    strengths.push("Fast response time");
    score += 5;
  } else if (responseHours > 12) {
    weaknesses.push("Slow response time");
    improvementRecommendations.push("Aim to respond within 2 hours");
    score -= 10;
  }

  const rating = input.avgRating ?? 0;
  if (rating >= 4.8) {
    strengths.push("Excellent ratings");
    score += 8;
  } else if (rating < 4) {
    weaknesses.push("Rating below average");
    improvementRecommendations.push("Address guest feedback to improve ratings");
    score -= 15;
  }

  const cancelRate = input.cancellationRate ?? 0;
  if (cancelRate > 0.1) {
    weaknesses.push("High cancellation rate");
    improvementRecommendations.push("Reduce cancellations; update calendar regularly");
    score -= 12;
  }

  const completeness = input.listingCompletenessPct ?? 80;
  if (completeness < 70) {
    weaknesses.push("Incomplete listing");
    improvementRecommendations.push("Complete listing details and photos");
    score -= 10;
  } else if (completeness >= 90) strengths.push("Complete listing");

  if (input.complaintCount != null && input.complaintCount > 2) {
    weaknesses.push("Multiple complaints");
    score -= 8;
  }

  score = Math.max(0, Math.min(100, score));
  const badgeEligibility: HostPerformanceOutput["badgeEligibility"] =
    score >= 90 ? "superhost" : score >= 80 ? "quality" : score >= 70 ? "rising" : "none";
  const confidence = 0.8;

  return {
    hostQualityScore: score,
    strengths,
    weaknesses,
    improvementRecommendations: improvementRecommendations.slice(0, 5),
    badgeEligibility,
    confidenceScore: confidence,
    recommendedAction: "recommend_host_improvement",
    reasonCodes: [...(strengths.length ? ["has_strengths"] : []), ...(weaknesses.length ? ["has_weaknesses"] : [])],
    escalateToHuman: false,
  };
}

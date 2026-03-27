import type { MarketplaceHealthInput, MarketplaceHealthOutput } from "../models/agents.js";

export function runMarketplaceHealthAgent(input: MarketplaceHealthInput): MarketplaceHealthOutput {
  const anomalyAlerts: string[] = [];
  const operationalRecommendations: string[] = [];
  const regionalRiskWarnings: string[] = [];
  let score = 80;

  if (input.bookingsTrend === "down") {
    anomalyAlerts.push("Bookings trend declining");
    score -= 10;
    operationalRecommendations.push("Review pricing and visibility for key markets");
  }
  if (input.cancellationsTrend === "up") {
    anomalyAlerts.push("Cancellations increasing");
    score -= 8;
    operationalRecommendations.push("Monitor cancellation reasons and host/guest communication");
  }
  if ((input.fraudAlertVolume ?? 0) > 10) {
    anomalyAlerts.push("Elevated fraud alert volume");
    score -= 15;
    operationalRecommendations.push("Prioritize fraud review queue");
  }
  if ((input.disputeVolume ?? 0) > 5) {
    anomalyAlerts.push("Dispute volume elevated");
    score -= 5;
  }
  if (input.supportTicketSpike) {
    anomalyAlerts.push("Support ticket spike");
    score -= 8;
    operationalRecommendations.push("Scale support or add triage");
  }
  if (input.paymentFailureSpike) {
    anomalyAlerts.push("Payment failure spike");
    score -= 12;
    regionalRiskWarnings.push("Check payment provider status and card declines");
  }
  if ((input.listingActivationRate ?? 100) < 80) {
    operationalRecommendations.push("Review listing approval flow and moderation backlog");
  }

  score = Math.max(0, Math.min(100, score));
  const confidence = 0.75;

  return {
    healthScore: score,
    anomalyAlerts,
    operationalRecommendations: operationalRecommendations.slice(0, 5),
    regionalRiskWarnings,
    confidenceScore: confidence,
    recommendedAction: anomalyAlerts.length > 0 ? "create_alert" : "no_action",
    reasonCodes: anomalyAlerts.map((a) => a.replace(/\s/g, "_").toLowerCase()),
    escalateToHuman: score < 70,
  };
}

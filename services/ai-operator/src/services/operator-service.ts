/**
 * Orchestrates agents, decision logging, and optional alert creation.
 * Only allows automated actions permitted by policies.
 */
import type { AgentType } from "../models/decisions.js";
import type { AlertType, AlertSeverity } from "../models/alerts.js";
import { mayAutomate } from "../policies/automation-boundaries.js";
import { logDecision } from "./decision-store.js";
import { createAlert } from "./alert-store.js";
import {
  runListingModerationAgent,
  runPricingAgent,
  runFraudRiskAgent,
  runBookingIntegrityAgent,
  runDemandForecastAgent,
  runHostPerformanceAgent,
  runSupportTriageAgent,
  runMarketplaceHealthAgent,
} from "../agents/index.js";
import type {
  ListingModerationInput,
  ListingModerationOutput,
  PricingInput,
  PricingOutput,
  FraudRiskInput,
  FraudRiskOutput,
  BookingIntegrityInput,
  BookingIntegrityOutput,
  DemandForecastInput,
  DemandForecastOutput,
  HostPerformanceInput,
  HostPerformanceOutput,
  SupportTriageInput,
  SupportTriageOutput,
  MarketplaceHealthInput,
  MarketplaceHealthOutput,
} from "../models/agents.js";

type AgentResult =
  | ListingModerationOutput
  | PricingOutput
  | FraudRiskOutput
  | BookingIntegrityOutput
  | DemandForecastOutput
  | HostPerformanceOutput
  | SupportTriageOutput
  | MarketplaceHealthOutput;

function getOutputSummary(output: AgentResult): Record<string, unknown> {
  return { ...output } as Record<string, unknown>;
}

function maybeCreateAlert(
  agentType: AgentType,
  entityType: string,
  entityId: string,
  output: AgentResult
): void {
  let alertType: AlertType = "marketplace_health";
  let severity: AlertSeverity = "medium";
  let message = "AI Operator alert";

  if (agentType === "listing_moderation") {
    const o = output as ListingModerationOutput;
    if (o.moderationStatus !== "approve" && o.listingQualityScore < 70) {
      alertType = "listing_quality";
      severity = o.listingQualityScore < 50 ? "high" : "medium";
      message = `Listing quality score ${o.listingQualityScore}; ${o.moderationStatus}`;
    }
  } else if (agentType === "fraud_risk") {
    const o = output as FraudRiskOutput;
    if (o.autoFlag) {
      alertType = "fraud_risk";
      severity = o.riskLevel === "critical" ? "critical" : "high";
      message = `Fraud risk ${o.riskLevel}; score ${o.fraudRiskScore}`;
    }
  } else if (agentType === "booking_integrity") {
    const o = output as BookingIntegrityOutput;
    if (o.suggestedAction !== "approve") {
      alertType = "booking_anomaly";
      severity = o.anomalyStatus === "anomaly" ? "high" : "medium";
      message = `Booking ${o.suggestedAction}; integrity score ${o.bookingIntegrityScore}`;
    }
  } else if (agentType === "marketplace_health") {
    const o = output as MarketplaceHealthOutput;
    if (o.healthScore < 70 && o.anomalyAlerts.length > 0) {
      severity = o.healthScore < 50 ? "high" : "medium";
      message = o.anomalyAlerts[0] ?? "Marketplace health alert";
    }
  }

  const action = (output as { recommendedAction?: string }).recommendedAction;
  if (action && mayAutomate(action)) {
    createAlert({
      alertType,
      severity,
      entityType,
      entityId,
      message,
      metadata: getOutputSummary(output),
    });
  }
}

export function analyzeListing(input: ListingModerationInput & { listingId?: string }) {
  const entityId = input.listingId ?? "unknown";
  const output = runListingModerationAgent(input);
  const automatedAction = output.recommendedAction === "flag_for_review" && mayAutomate("flag_listing_for_review")
    ? "flag_listing_for_review"
    : null;
  logDecision({
    agentType: "listing_moderation",
    entityType: "listing",
    entityId,
    inputSummary: { title: input.title, photoCount: input.photoCount, amenitiesCount: (input.amenities ?? []).length },
    outputSummary: getOutputSummary(output),
    confidenceScore: output.confidenceScore,
    recommendedAction: output.recommendedAction,
    reasonCodes: output.reasonCodes,
    automatedAction,
    humanOverride: null,
  });
  maybeCreateAlert("listing_moderation", "listing", entityId, output);
  return output;
}

export function recommendPricing(input: PricingInput & { listingId?: string }) {
  const entityId = input.listingId ?? "listing";
  const output = runPricingAgent(input);
  const automatedAction = mayAutomate("suggest_price_update") ? "suggest_price_update" : null;
  logDecision({
    agentType: "pricing",
    entityType: "listing",
    entityId,
    inputSummary: { location: input.location, demandLevel: input.demandLevel },
    outputSummary: getOutputSummary(output),
    confidenceScore: output.confidenceScore,
    recommendedAction: output.recommendedAction,
    reasonCodes: output.reasonCodes,
    automatedAction,
    humanOverride: null,
  });
  return output;
}

export function evaluateFraud(input: FraudRiskInput) {
  const entityId = input.bookingId ?? input.userId ?? "unknown";
  const output = runFraudRiskAgent(input);
  const automatedAction = output.autoFlag && mayAutomate("flag_booking_for_review") ? "flag_booking_for_review" : null;
  logDecision({
    agentType: "fraud_risk",
    entityType: input.bookingId ? "booking" : "user",
    entityId,
    inputSummary: { signalCount: input.signals?.length ?? 0 },
    outputSummary: getOutputSummary(output),
    confidenceScore: output.confidenceScore,
    recommendedAction: output.recommendedAction,
    reasonCodes: output.reasonCodes,
    automatedAction,
    humanOverride: null,
  });
  maybeCreateAlert("fraud_risk", input.bookingId ? "booking" : "user", entityId, output);
  return output;
}

export function checkBooking(input: BookingIntegrityInput) {
  const entityId = input.bookingId ?? "unknown";
  const output = runBookingIntegrityAgent(input);
  const automatedAction =
    output.suggestedAction !== "approve" && mayAutomate("flag_booking_for_review") ? "flag_booking_for_review" : null;
  logDecision({
    agentType: "booking_integrity",
    entityType: "booking",
    entityId,
    inputSummary: { nights: input.nights },
    outputSummary: getOutputSummary(output),
    confidenceScore: output.confidenceScore,
    recommendedAction: output.recommendedAction,
    reasonCodes: output.reasonCodes,
    automatedAction,
    humanOverride: null,
  });
  maybeCreateAlert("booking_integrity", "booking", entityId, output);
  return output;
}

export function forecastDemand(input: DemandForecastInput) {
  const output = runDemandForecastAgent(input);
  logDecision({
    agentType: "demand_forecast",
    entityType: "market",
    entityId: input.market,
    inputSummary: { market: input.market },
    outputSummary: getOutputSummary(output),
    confidenceScore: output.confidenceScore,
    recommendedAction: output.recommendedAction,
    reasonCodes: output.reasonCodes,
    automatedAction: mayAutomate("set_demand_forecast") ? "set_demand_forecast" : null,
    humanOverride: null,
  });
  return output;
}

export function analyzeHost(input: HostPerformanceInput) {
  const output = runHostPerformanceAgent(input);
  logDecision({
    agentType: "host_performance",
    entityType: "host",
    entityId: input.hostId,
    inputSummary: { hostId: input.hostId },
    outputSummary: getOutputSummary(output),
    confidenceScore: output.confidenceScore,
    recommendedAction: output.recommendedAction,
    reasonCodes: output.reasonCodes,
    automatedAction: mayAutomate("recommend_host_improvement") ? "recommend_host_improvement" : null,
    humanOverride: null,
  });
  return output;
}

export function triageSupport(input: SupportTriageInput & { ticketId?: string }) {
  const entityId = input.ticketId ?? "ticket";
  const output = runSupportTriageAgent(input);
  logDecision({
    agentType: "support_triage",
    entityType: "ticket",
    entityId,
    inputSummary: { subject: input.subject },
    outputSummary: getOutputSummary(output),
    confidenceScore: output.confidenceScore,
    recommendedAction: output.recommendedAction,
    reasonCodes: output.reasonCodes,
    automatedAction: mayAutomate("route_support_ticket") ? "route_support_ticket" : null,
    humanOverride: null,
  });
  return output;
}

export function checkMarketplaceHealth(input: MarketplaceHealthInput) {
  const output = runMarketplaceHealthAgent(input);
  logDecision({
    agentType: "marketplace_health",
    entityType: "marketplace",
    entityId: "global",
    inputSummary: input as Record<string, unknown>,
    outputSummary: getOutputSummary(output),
    confidenceScore: output.confidenceScore,
    recommendedAction: output.recommendedAction,
    reasonCodes: output.reasonCodes,
    automatedAction: output.recommendedAction === "create_alert" && mayAutomate("create_alert") ? "create_alert" : null,
    humanOverride: null,
  });
  maybeCreateAlert("marketplace_health", "marketplace", "global", output);
  return output;
}

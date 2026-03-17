import type { BookingIntegrityInput, BookingIntegrityOutput } from "../models/agents.js";

export function runBookingIntegrityAgent(input: BookingIntegrityInput): BookingIntegrityOutput {
  const reasonCodes: string[] = [];
  let score = 85;

  if ((input.cancellationHistoryCount ?? 0) > 3) {
    score -= 15;
    reasonCodes.push("high_guest_cancellations");
  }
  if ((input.overlapAttempts ?? 0) > 0) {
    score -= 25;
    reasonCodes.push("overlap_attempt");
  }
  if (input.nights != null && input.nights > 90) {
    score -= 10;
    reasonCodes.push("very_long_stay");
  }
  if (reasonCodes.length === 0) reasonCodes.push("normal_booking");

  score = Math.max(0, Math.min(100, score));
  const anomalyStatus: BookingIntegrityOutput["anomalyStatus"] =
    score >= 80 ? "normal" : score >= 60 ? "suspicious" : "anomaly";
  const suggestedAction: BookingIntegrityOutput["suggestedAction"] =
    anomalyStatus === "normal" ? "approve" : anomalyStatus === "suspicious" ? "review" : "hold";
  const confidence = score >= 80 ? 0.9 : score >= 60 ? 0.7 : 0.6;

  return {
    bookingIntegrityScore: score,
    anomalyStatus,
    suggestedAction,
    confidenceScore: confidence,
    recommendedAction: suggestedAction === "approve" ? "approve_booking" : "flag_for_review",
    reasonCodes,
    escalateToHuman: suggestedAction !== "approve",
  };
}

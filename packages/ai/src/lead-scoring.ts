/**
 * AI lead scoring – score, temperature (hot/warm/cold), and explanation.
 * Rule-based and explainable (not ML). Bands: 80–100 hot, 50–79 warm, 0–49 cold.
 */

export type LeadInput = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  [key: string]: unknown;
};

export type LeadScoreResult = {
  score: number;
  temperature: "hot" | "warm" | "cold";
  explanation: string;
};

const URGENCY_PHRASES = /ready|urgent|asap|this week|immediately|today|tomorrow|quick|interested now|ready to (buy|view|sign|close)|budget (approved|ready)|pre-approved/i;

export function scoreLead(lead: LeadInput): LeadScoreResult {
  const message = typeof lead?.message === "string" ? lead.message.trim() : "";
  const hasEmail = !!lead?.email && String(lead.email).trim().length > 0;
  const hasPhone = !!lead?.phone && String(lead.phone).trim().length > 0;
  const hasName = !!lead?.name && String(lead.name).trim().length > 0;

  let score = 25;
  const reasons: string[] = [];

  if (message.length >= 50) {
    score += 18;
    reasons.push("Detailed message");
  } else if (message.length >= 20) {
    score += 10;
    reasons.push("Message provided");
  }
  if (URGENCY_PHRASES.test(message)) {
    score += 22;
    reasons.push("Urgency or readiness indicated");
  }
  if (hasEmail) {
    score += 10;
    reasons.push("Email provided");
  }
  if (hasPhone) {
    score += 12;
    reasons.push("Phone provided");
  }
  if (hasName) {
    score += 5;
    reasons.push("Name provided");
  }
  if (/budget|price|offer|pre-approv|financing/i.test(message)) {
    score += 12;
    reasons.push("Budget or financing mentioned");
  }

  score = Math.min(100, Math.max(0, score));

  const temperature: LeadScoreResult["temperature"] =
    score >= 80 ? "hot" : score >= 50 ? "warm" : "cold";

  const explanation =
    reasons.length > 0
      ? reasons.join(". ")
      : "Minimal info provided; follow up for details.";

  return { score, temperature, explanation };
}

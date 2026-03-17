import type { SupportTriageInput, SupportTriageOutput } from "../models/agents.js";

export function runSupportTriageAgent(input: SupportTriageInput): SupportTriageOutput {
  const text = `${input.subject ?? ""} ${input.body}`.toLowerCase();
  const reasonCodes: string[] = [];
  let urgencyScore = 3;
  let category = "general";

  if (text.includes("refund") || text.includes("payment") || text.includes("charge")) {
    category = "payment";
    reasonCodes.push("payment_related");
    if (text.includes("refund")) urgencyScore = 6;
  }
  if (text.includes("cancel")) {
    category = "cancellation";
    reasonCodes.push("cancellation");
    urgencyScore = Math.max(urgencyScore, 5);
  }
  if (text.includes("dispute") || text.includes("complaint") || text.includes("problem")) {
    category = "dispute";
    reasonCodes.push("dispute");
    urgencyScore = Math.max(urgencyScore, 7);
  }
  if (text.includes("urgent") || text.includes("asap") || text.includes("immediately")) {
    urgencyScore = Math.min(10, urgencyScore + 2);
    reasonCodes.push("urgent_language");
  }
  if (text.includes("verification")) {
    category = "verification";
    urgencyScore = Math.min(urgencyScore, 4);
  }

  const escalationTarget =
    category === "dispute" ? "dispute_team" : category === "payment" ? "payments_team" : undefined;
  let suggestedReply: string | undefined;
  if (category === "payment") {
    suggestedReply = "Thank you for reaching out. We've received your payment-related inquiry and will look into it within 24 hours.";
  } else if (category === "dispute") {
    suggestedReply = "We're sorry to hear about this. Our team will review the details and get back to you with next steps.";
  }

  return {
    category,
    urgencyScore: Math.min(10, urgencyScore),
    suggestedReply,
    escalationTarget,
    confidenceScore: 0.8,
    recommendedAction: "route_support_ticket",
    reasonCodes: reasonCodes.length ? reasonCodes : ["general"],
    escalateToHuman: urgencyScore >= 7,
  };
}

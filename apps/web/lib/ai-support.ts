/**
 * Customer Support AI – ticket classification, urgency, suggested responses, summarization.
 * Integrates with support dashboards; uses rule-based + placeholders for ML.
 */
import { prisma } from "@/lib/db";

export type TicketClassification = {
  category: string;
  urgency: "low" | "medium" | "high" | "critical";
  suggestedTags: string[];
  suggestedResponse?: string;
};

/**
 * Classify a support ticket (dispute or generic) for routing and priority.
 */
export async function classifySupportTicket(params: {
  subject?: string;
  body: string;
  entityType?: string;
  entityId?: string;
}): Promise<TicketClassification> {
  const body = (params.body ?? "").toLowerCase();
  const subject = (params.subject ?? "").toLowerCase();
  const text = `${subject} ${body}`;

  let category = "general";
  let urgency: TicketClassification["urgency"] = "medium";
  const suggestedTags: string[] = [];

  if (text.includes("payment") || text.includes("refund") || text.includes("charge")) {
    category = "payment";
    suggestedTags.push("payment");
    if (text.includes("refund")) suggestedTags.push("refund");
    urgency = text.includes("not received") ? "high" : "medium";
  }
  if (text.includes("cancel") || text.includes("cancellation")) {
    category = "cancellation";
    suggestedTags.push("cancellation");
    urgency = "medium";
  }
  if (text.includes("dispute") || text.includes("complaint") || text.includes("problem with")) {
    category = "dispute";
    suggestedTags.push("dispute");
    urgency = "high";
  }
  if (text.includes("verification") || text.includes("verified")) {
    category = "verification";
    suggestedTags.push("verification");
    urgency = "low";
  }
  if (text.includes("urgent") || text.includes("asap") || text.includes("immediately")) {
    urgency = urgency === "high" ? "critical" : "high";
  }

  let suggestedResponse: string | undefined;
  if (category === "payment") {
    suggestedResponse = "Thank you for reaching out. We've received your payment-related inquiry and will look into it. Our team typically responds within 24 hours.";
  } else if (category === "dispute") {
    suggestedResponse = "We're sorry to hear about this. Our dispute resolution team will review the details and get back to you with next steps.";
  }

  return { category, urgency, suggestedTags, suggestedResponse };
}

/**
 * Summarize a dispute for support (first N messages).
 */
export async function summarizeDispute(disputeId: string): Promise<{ summary: string; parties: string; messageCount: number }> {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
  });
  if (!dispute) return { summary: "", parties: "", messageCount: 0 };

  const parties = `Claimant: ${dispute.claimant} (${dispute.claimantUserId})`;
  const excerpt = dispute.description.slice(0, 200) + (dispute.description.length > 200 ? "…" : "");
  const summary = `Dispute: ${dispute.status}. ${excerpt} Messages: ${dispute.messages.length}.`;
  return { summary, parties, messageCount: dispute.messages.length };
}

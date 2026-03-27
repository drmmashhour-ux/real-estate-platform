import type { SupportAssistantInput, SupportAssistantOutput } from "../models/index.js";

/**
 * Support AI: summarize disputes, suggest replies, answer common questions.
 */
export function runSupportAssistant(input: SupportAssistantInput): SupportAssistantOutput {
  switch (input.action) {
    case "summarize_dispute": {
      const messages = input.messages ?? [];
      const text = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
      return {
        summary:
          text.length > 300
            ? `Dispute conversation (${messages.length} messages). Key points: ${text.slice(0, 300)}…`
            : `Summary: ${text || "No messages provided."}`,
        urgency: "medium",
      };
    }
    case "suggest_reply": {
      const last = input.messages?.slice(-2).map((m) => m.content).join(" ") ?? input.question ?? "";
      if (last.toLowerCase().includes("refund") || last.toLowerCase().includes("cancel")) {
        return {
          suggestedReply:
            "Thank you for reaching out. We've received your request and will review it according to our cancellation policy. We'll get back to you within 24 hours.",
          suggestedTags: ["refund", "cancellation"],
          urgency: "medium",
        };
      }
      return {
        suggestedReply:
          "Thank you for your message. We're looking into this and will respond with an update shortly.",
        urgency: "low",
      };
    }
    case "answer_question": {
      const q = (input.question ?? "").toLowerCase();
      if (q.includes("cancel") || q.includes("cancellation")) {
        return {
          answer:
            "Cancellation policy depends on the listing and timing. You can view the policy on the listing page. For refund requests, contact support with your booking ID.",
          suggestedTags: ["cancellation"],
          urgency: "low",
        };
      }
      if (q.includes("check-in") || q.includes("key") || q.includes("access")) {
        return {
          answer:
            "Check-in instructions are sent by the host after booking. Check your confirmation email and the booking details page.",
          urgency: "low",
        };
      }
      if (q.includes("payout") || q.includes("payment") || q.includes("host")) {
        return {
          answer:
            "Host payouts are typically processed within 24–48 hours after checkout. You can see payout status in your host dashboard.",
          urgency: "low",
        };
      }
      return {
        answer:
          "For more help, please provide your booking ID or describe your question in detail. Our team typically responds within 24 hours.",
        urgency: "low",
      };
    }
    default:
      return { answer: "How can we help?", urgency: "low" };
  }
}

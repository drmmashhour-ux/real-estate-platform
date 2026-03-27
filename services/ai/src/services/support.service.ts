import type { SupportInput, SupportOutput } from "../models/index.js";

/**
 * AI support assistant: answer host/guest questions, summarize disputes, suggest responses.
 * Rule-based replies; can be replaced by LLM using prompts/support.
 */
export function handleSupport(input: SupportInput): SupportOutput {
  switch (input.type) {
    case "host_question": {
      const m = (input.message ?? "").toLowerCase();
      if (m.includes("payout") || m.includes("payment")) {
        return {
          answer: "Host payouts are processed after checkout, usually within 24–48 hours. You can see payout status in your dashboard under Bookings.",
          urgency: "low",
        };
      }
      if (m.includes("cancel") || m.includes("cancellation")) {
        return {
          answer: "You can decline a request or cancel a confirmed booking from the booking page. Cancellation policy applies; check your listing settings.",
          suggestedTags: ["cancellation", "host"],
          urgency: "medium",
        };
      }
      return {
        answer: "Thanks for reaching out. For host-specific help, visit the Host Help Center or describe your question in more detail.",
        urgency: "low",
      };
    }
    case "guest_question": {
      const m = (input.message ?? "").toLowerCase();
      if (m.includes("refund")) {
        return {
          answer: "Refund eligibility depends on the listing's cancellation policy and timing. Contact support with your booking ID for a review.",
          suggestedTags: ["refund", "guest"],
          urgency: "medium",
        };
      }
      if (m.includes("check-in") || m.includes("key")) {
        return {
          answer: "Check-in instructions are sent by the host after booking. Check your confirmation email and the booking page for details.",
          urgency: "low",
        };
      }
      return {
        answer: "We're here to help. Please share your booking ID or question details so we can assist you.",
        urgency: "low",
      };
    }
    case "dispute_summary": {
      const conv = input.conversation ?? [];
      const text = conv.map((c) => `${c.role}: ${c.content}`).join("\n");
      return {
        summary: text.length > 200 ? `Conversation (${conv.length} messages). Key points: ${text.slice(0, 200)}…` : `Summary: ${text || "No messages yet."}`,
        urgency: "medium",
      };
    }
    case "suggest_response": {
      const last = input.conversation?.slice(-2);
      const context = last?.map((c) => c.content).join(" ") ?? input.message ?? "";
      if (context.includes("refund") || context.includes("cancel")) {
        return {
          suggestedResponse: "Thank you for your message. We've reviewed the situation and will follow up with the appropriate resolution per our cancellation policy. We'll get back to you within 24 hours.",
          urgency: "medium",
        };
      }
      return {
        suggestedResponse: "Thank you for reaching out. We're looking into this and will respond with an update shortly.",
        urgency: "low",
      };
    }
    default:
      return { answer: "How can we help you today?", urgency: "low" };
  }
}

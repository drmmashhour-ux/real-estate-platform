import { NextRequest } from "next/server";
import {
  classifySupportTicket,
  summarizeDispute,
} from "@/lib/ai-support";

export const dynamic = "force-dynamic";

/** POST /api/ai/support – AI support assistant: answer questions, summarize disputes, suggest responses. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, message, conversation, disputeId, subject, body: ticketBody, entityType, entityId } = body;
    if (!type || !["host_question", "guest_question", "dispute_summary", "suggest_response"].includes(type)) {
      return Response.json({ error: "type must be host_question, guest_question, dispute_summary, or suggest_response" }, { status: 400 });
    }

    if (type === "host_question" || type === "guest_question") {
      const classification = await classifySupportTicket({
        subject: subject ?? message,
        body: ticketBody ?? message ?? "",
        entityType,
        entityId,
      });
      return Response.json({
        answer: classification.suggestedResponse,
        suggestedTags: classification.suggestedTags,
        urgency: classification.urgency,
        category: classification.category,
      });
    }

    if (type === "dispute_summary" && disputeId) {
      const summary = await summarizeDispute(disputeId as string);
      return Response.json({
        summary: summary.summary,
        parties: summary.parties,
        messageCount: summary.messageCount,
      });
    }

    if (type === "suggest_response") {
      const classification = await classifySupportTicket({
        subject: subject ?? "",
        body: ticketBody ?? (Array.isArray(conversation) ? conversation.map((c: { content?: string }) => c.content).join(" ") : message ?? ""),
        entityType,
        entityId,
      });
      return Response.json({
        suggestedResponse: classification.suggestedResponse,
        suggestedTags: classification.suggestedTags,
        urgency: classification.urgency,
      });
    }

    return Response.json({ error: "Missing disputeId for dispute_summary or invalid type" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Failed to process support request" },
      { status: 500 }
    );
  }
}

import { NextRequest } from "next/server";
import { isAiManagerEnabled, callAiManager } from "@/lib/ai-manager-client";
import { classifySupportTicket } from "@/lib/ai-support";

export const dynamic = "force-dynamic";

/** POST /api/ai/support-assistant – summarize dispute, suggest reply, or answer question. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, disputeId, messages, question, context } = body;
    if (!action || !["summarize_dispute", "suggest_reply", "answer_question"].includes(action)) {
      return Response.json(
        { error: "action must be summarize_dispute, suggest_reply, or answer_question" },
        { status: 400 }
      );
    }

    if (isAiManagerEnabled()) {
      const result = await callAiManager<{
        summary?: string;
        suggestedReply?: string;
        answer?: string;
        suggestedTags?: string[];
        urgency?: string;
      }>("/v1/ai-manager/support-assistant", body);
      return Response.json(result);
    }

    if (action === "summarize_dispute") {
      const conv = messages ?? [];
      const text = conv.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join("\n");
      const summary =
        text.length > 300
          ? `Conversation (${conv.length} messages). Key points: ${text.slice(0, 300)}…`
          : text || "No messages provided.";
      return Response.json({ summary, urgency: "medium" });
    }

    if (action === "suggest_reply") {
      const classification = await classifySupportTicket({
        body: (messages ?? []).map((m: { content: string }) => m.content).join(" ") || question ?? "",
      });
      return Response.json({
        suggestedReply: classification.suggestedResponse,
        suggestedTags: classification.suggestedTags,
        urgency: classification.urgency,
      });
    }

    if (action === "answer_question") {
      const classification = await classifySupportTicket({
        body: question ?? "",
      });
      return Response.json({
        answer: classification.suggestedResponse,
        suggestedTags: classification.suggestedTags,
        urgency: classification.urgency,
      });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Failed to run support assistant" },
      { status: 500 }
    );
  }
}

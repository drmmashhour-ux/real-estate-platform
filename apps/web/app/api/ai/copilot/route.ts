import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { buildRetrievalAugmentedResponse } from "@/modules/copilot/infrastructure/retrievalAugmentedResponseBuilder";
import { runAiCoreCopilot } from "@/modules/ai-core/application/copilotService";
import { storeFeedbackSignal } from "@/modules/ai-training/application/storeFeedbackSignal";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question) return NextResponse.json({ error: "question is required" }, { status: 400 });
  const listingId = typeof body?.listingId === "string" ? body.listingId : undefined;
  const leadId = typeof body?.leadId === "string" ? body.leadId : undefined;
  const workspaceId = typeof body?.workspaceId === "string" ? body.workspaceId : undefined;
  const userId = await getGuestId().catch(() => null);

  const result = await runAiCoreCopilot(prisma, { question, listingId, leadId });
  const rag = await buildRetrievalAugmentedResponse({
    query: question,
    userId,
    workspaceId,
    listingId,
    leadId,
    city: typeof body?.city === "string" ? body.city : undefined,
    intent: "ai_core_copilot",
  });

  const response = {
    ...result,
    answer: rag.summary,
    grounded: true,
    deterministic: rag.deterministic,
    retrievedKnowledge: rag.retrievedKnowledge.slice(0, 8),
  };

  await storeFeedbackSignal(prisma, {
    subsystem: "copilot",
    entityType: listingId ? "listing" : leadId ? "lead" : "general",
    entityId: listingId ?? leadId ?? "none",
    userId,
    promptOrQuery: question,
    outputSummary: response.answer,
    metadata: { grounded: true, source: "api/ai/copilot" },
  }).catch(() => {});

  return NextResponse.json(response);
}

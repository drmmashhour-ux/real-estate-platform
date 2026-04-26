import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getLeadIntelligence } from "@/modules/ai-core/application/leadIntelligenceService";
import { storeFeedbackSignal } from "@/modules/ai-training/application/storeFeedbackSignal";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const leadId = typeof body?.leadId === "string" ? body.leadId : "";
  if (!leadId) return NextResponse.json({ error: "leadId is required" }, { status: 400 });

  const insight = await getLeadIntelligence(prisma, leadId);
  if (!insight) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  await storeFeedbackSignal(prisma, {
    subsystem: "crm",
    entityType: "lead",
    entityId: leadId,
    promptOrQuery: "auto:lead-insights",
    outputSummary: insight.autoMessages.summary,
    metadata: { leadScore: insight.leadScore, urgency: insight.urgency },
  }).catch(() => {});
  return NextResponse.json(insight);
}

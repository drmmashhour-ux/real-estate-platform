import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { appendLeadTimelineEvent } from "@/lib/leads/timeline-helpers";
import { refreshEvaluationLeadCrmScore } from "@/lib/leads/refresh-evaluation-score";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ALLOWED_EVENTS = new Set([
  "consultation_cta",
  "call",
  "whatsapp",
  "broker_card",
  "evaluation_result_view",
]);

/**
 * Anonymous engagement tracking (e.g. /evaluate result CTAs). Rate-limited.
 */
export async function POST(req: Request) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "anonymous";
  const limit = checkRateLimit(`public:lead-activity:${ip}`, { windowMs: 60_000, max: 40 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  const body = await req.json().catch(() => ({}));
  const leadId = typeof body.leadId === "string" ? body.leadId.trim() : "";
  const eventType = typeof body.eventType === "string" ? body.eventType.trim() : "";

  if (!leadId || !ALLOWED_EVENTS.has(eventType)) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (eventType === "evaluation_result_view") {
    const ai = (lead.aiExplanation ?? {}) as Record<string, unknown>;
    const visits = (ai.evaluationVisits ?? {}) as Record<string, unknown>;
    const prev = typeof visits.resultViewCount === "number" ? visits.resultViewCount : 0;
    const resultViewCount = prev + 1;
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        aiExplanation: {
          ...ai,
          evaluationVisits: { ...visits, resultViewCount, lastAt: new Date().toISOString() },
        } as object,
      },
    });
    await appendLeadTimelineEvent(leadId, "evaluation_result_view", {
      resultViewCount,
      source: "evaluate_public",
    });
    if (lead.leadSource === "evaluation_lead") {
      await refreshEvaluationLeadCrmScore(leadId).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  }

  const timelineType =
    eventType === "consultation_cta"
      ? "consultation_requested"
      : eventType === "broker_card"
        ? "broker_card_clicked"
        : eventType === "call"
          ? "call_clicked"
          : "whatsapp_clicked";

  await appendLeadTimelineEvent(leadId, timelineType, { source: "evaluate_public" });

  const bumpIntent =
    eventType === "call" ||
    eventType === "whatsapp" ||
    eventType === "consultation_cta" ||
    eventType === "broker_card";

  if (lead.leadSource === "evaluation_lead") {
    const ai = (lead.aiExplanation ?? {}) as Record<string, unknown>;
    const prev = (ai.evaluationEngagement ?? {}) as Record<string, unknown>;
    const nextEng = { ...prev };
    if (eventType === "consultation_cta") nextEng.consultationCta = true;
    if (eventType === "call") nextEng.call = true;
    if (eventType === "whatsapp") nextEng.whatsapp = true;
    if (eventType === "broker_card") nextEng.brokerCard = true;

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        ...(bumpIntent ? { highIntent: true } : {}),
        aiExplanation: {
          ...ai,
          evaluationEngagement: nextEng,
        } as object,
      },
    });

    await refreshEvaluationLeadCrmScore(leadId).catch(() => {});
  } else if (bumpIntent) {
    await prisma.lead
      .update({
        where: { id: leadId },
        data: { highIntent: true },
      })
      .catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

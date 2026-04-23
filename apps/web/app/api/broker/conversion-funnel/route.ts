import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const FUNNEL_EVENTS = [
  "search",
  "listing_view",
  "listing_contact_click",
  "listing_save",
  "immo_ai_chat_started",
  "immo_ai_qualification_complete",
  "immo_ai_contact_captured",
  "immo_ai_hot_lead",
  "funnel_listing_card_click",
  "funnel_broker_handoff_logged",
] as const;

/**
 * GET /api/broker/conversion-funnel — anonymized funnel counts (platform-wide, last N days).
 * Broker/Admin only. Uses aggregate counts only (no PII).
 */
export async function GET(request: Request) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "BROKER" && user?.role !== "ADMIN") {
    return Response.json({ error: "Broker access only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") ?? "14", 10) || 14));
  const since = new Date(Date.now() - days * 86400000);

  const [activityGroups, leadsTotal, leadsHot, leadsImmo] = await Promise.all([
    prisma.aiUserActivityLog.groupBy({
      by: ["eventType"],
      where: {
        createdAt: { gte: since },
        eventType: { in: [...FUNNEL_EVENTS] },
      },
      _count: { id: true },
    }),
    prisma.lead.count({ where: { createdAt: { gte: since } } }),
    prisma.lead.count({
      where: { createdAt: { gte: since }, OR: [{ aiTier: "hot" }, { score: { gte: 85 } }] },
    }),
    prisma.lead.count({
      where: { createdAt: { gte: since }, leadSource: "immo_ai_chat" },
    }),
  ]);

  const byEvent: Record<string, number> = {};
  for (const e of FUNNEL_EVENTS) byEvent[e] = 0;
  for (const row of activityGroups) {
    byEvent[row.eventType] = row._count.id;
  }

  const searches = byEvent.search ?? 0;
  const cardClicks = byEvent.funnel_listing_card_click ?? 0;
  const views = byEvent.listing_view ?? 0;
  const contactClicks = byEvent.listing_contact_click ?? 0;
  const chatStarts = byEvent.immo_ai_chat_started ?? 0;
  const qualified = byEvent.immo_ai_qualification_complete ?? 0;
  const captured = byEvent.immo_ai_contact_captured ?? 0;
  const hotLeads = byEvent.immo_ai_hot_lead ?? 0;
  const handoffs = byEvent.funnel_broker_handoff_logged ?? 0;

  const rate = (num: number, den: number) =>
    den <= 0 ? null : `${Math.round((num / den) * 1000) / 10}%`;

  return Response.json({
    days,
    since: since.toISOString(),
    activityByEvent: byEvent,
    leads: {
      total: leadsTotal,
      hotApprox: leadsHot,
      immoAiChat: leadsImmo,
    },
    hints: {
      searchToView: rate(views, searches),
      viewToContact: rate(contactClicks, views),
      contactToChat: rate(chatStarts, contactClicks),
      chatToCapture: rate(captured, chatStarts),
      captureToHot: rate(hotLeads, captured),
    },
    note: "Rates are directional — events require signed-in users. Anonymous traffic is not included.",
  });
}

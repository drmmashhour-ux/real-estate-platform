import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { buildFiveMetricReport } from "@/src/modules/messaging/growthAiOpsMetrics";
import {
  computePressureScoreForConversation,
  fetchUserMessageStatsForConversations,
} from "@/src/modules/messaging/growthAiStage";
import { getTemplatePerformanceMetrics } from "@/src/modules/messaging/templateAnalytics";

export const dynamic = "force-dynamic";

/** GET /api/admin/ai-inbox/conversations — filters: handoff, outcome, highIntent, objection, handoffRequired, stage */
export async function GET(req: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const handoffOnly = sp.get("handoff") === "1";
  const outcomeFilter = sp.get("outcome")?.trim() || null;
  const highIntentOnly = sp.get("highIntent") === "1";
  const objectionFilter = sp.get("objection")?.trim() || null;
  const handoffRequiredFilter = sp.get("handoffRequired") === "1";
  const stageFilter = sp.get("stage")?.trim() || null;

  const where = {
    status: "open" as const,
    ...(handoffOnly ? { handoffs: { some: { status: "pending" as const } } } : {}),
    ...(outcomeFilter ? { outcome: outcomeFilter } : {}),
    ...(stageFilter ? { stage: stageFilter } : {}),
    ...(highIntentOnly ? { highIntent: true } : {}),
    ...(objectionFilter
      ? {
          messages: {
            some: {
              senderType: "user",
              detectedObjection: objectionFilter,
            },
          },
        }
      : {}),
    ...(handoffRequiredFilter
      ? {
          messages: {
            some: {
              senderType: "ai",
              handoffRequired: true,
            },
          },
        }
      : {}),
  };

  const rows = await prisma.growthAiConversation.findMany({
    where,
    take: 80,
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      handoffs: { where: { status: "pending" }, take: 1 },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const rowIds = rows.map((r) => r.id);
  const userStatsMap = await fetchUserMessageStatsForConversations(rowIds);

  const objectionBreakdown = await prisma.growthAiConversationMessage.groupBy({
    by: ["detectedObjection"],
    where: { senderType: "ai", detectedObjection: { not: null } },
    _count: { id: true },
  });

  const outcomeBreakdown = await prisma.growthAiConversation.groupBy({
    by: ["outcome"],
    where: { status: "open", outcome: { not: null } },
    _count: { id: true },
  });

  let templatePerformance = await getTemplatePerformanceMetrics();
  if (templatePerformance.length === 0) {
    const fallback = await prisma.growthAiConversationMessage.groupBy({
      by: ["templateKey"],
      where: { senderType: "ai", templateKey: { not: null } },
      _count: { id: true },
    });
    templatePerformance = fallback.map((t) => ({
      templateKey: t.templateKey!,
      sent: t._count.id,
      replyAfter: 0,
      conversionBooked: 0,
    }));
  }

  const openWhere = { status: "open" as const };
  const [
    totalOpen,
    engagedCount,
    outcomeBooked,
    outcomeHandoff,
    outcomeStale,
    highIntentTotal,
    highIntentBooked,
  ] = await Promise.all([
    prisma.growthAiConversation.count({ where: openWhere }),
    prisma.growthAiConversation.count({
      where: {
        ...openWhere,
        outcome: { in: ["replied", "qualified", "call_scheduled", "booked"] },
      },
    }),
    prisma.growthAiConversation.count({ where: { ...openWhere, outcome: "booked" } }),
    prisma.growthAiConversation.count({ where: { ...openWhere, outcome: "handoff" } }),
    prisma.growthAiConversation.count({ where: { ...openWhere, outcome: "stale" } }),
    prisma.growthAiConversation.count({ where: { ...openWhere, highIntent: true } }),
    prisma.growthAiConversation.count({ where: { ...openWhere, highIntent: true, outcome: "booked" } }),
  ]);

  const [stageBreakdown, closingStageTotal, closingStageBooked, bookedByStage, staleByStage] = await Promise.all([
    prisma.growthAiConversation.groupBy({
      by: ["stage"],
      where: openWhere,
      _count: { id: true },
    }),
    prisma.growthAiConversation.count({ where: { ...openWhere, stage: "closing" } }),
    prisma.growthAiConversation.count({ where: { ...openWhere, stage: "closing", outcome: "booked" } }),
    prisma.growthAiConversation.groupBy({
      by: ["stage"],
      where: { ...openWhere, outcome: "booked" },
      _count: { id: true },
    }),
    prisma.growthAiConversation.groupBy({
      by: ["stage"],
      where: { ...openWhere, outcome: "stale" },
      _count: { id: true },
    }),
  ]);

  const safeDiv = (a: number, b: number) => (b > 0 ? a / b : 0);

  const fiveRates = {
    replyRate: safeDiv(engagedCount, totalOpen),
    highIntentRate: safeDiv(highIntentTotal, totalOpen),
    conversionRate: safeDiv(outcomeBooked, totalOpen),
    handoffRate: safeDiv(outcomeHandoff, totalOpen),
    staleRate: safeDiv(outcomeStale, totalOpen),
  };

  const opsReport = buildFiveMetricReport(totalOpen, fiveRates);

  const bookedStageMap = new Map(bookedByStage.map((s) => [s.stage, s._count.id]));
  const staleStageMap = new Map(staleByStage.map((s) => [s.stage, s._count.id]));

  const stageAnalytics = stageBreakdown.map((s) => {
    const total = s._count.id;
    const booked = bookedStageMap.get(s.stage) ?? 0;
    const stale = staleStageMap.get(s.stage) ?? 0;
    return {
      stage: s.stage,
      conversations: total,
      booked,
      stale,
      conversionRate: safeDiv(booked, total),
      dropOffRate: safeDiv(stale, total),
    };
  });

  const closingStageSuccessRate = safeDiv(closingStageBooked, closingStageTotal);

  return Response.json({
    conversations: rows.map((r) => {
      const st = userStatsMap.get(r.id) ?? { userMessageCount: 0, lastObjection: null };
      const pressureScore = computePressureScoreForConversation(
        { highIntent: r.highIntent, outcome: r.outcome, contextJson: r.contextJson },
        { userMessageCount: st.userMessageCount, lastUserObjection: st.lastObjection }
      );
      return {
      id: r.id,
      userId: r.userId,
      channel: r.channel,
      status: r.status,
      assignedToId: r.assignedToId,
      humanTakeoverAt: r.humanTakeoverAt?.toISOString() ?? null,
      aiReplyPending: r.aiReplyPending,
      outcome: r.outcome,
      stage: r.stage,
      pressureScore,
      highIntent: r.highIntent,
      growthAiOutcome: r.growthAiOutcome,
      growthAiOutcomeAt: r.growthAiOutcomeAt?.toISOString() ?? null,
      silentNudgeSentAt: r.silentNudgeSentAt?.toISOString() ?? null,
      highIntentAssistNudgeSentAt: r.highIntentAssistNudgeSentAt?.toISOString() ?? null,
      lastUserMessageAt: r.lastUserMessageAt?.toISOString() ?? null,
      lastAiMessageAt: r.lastAiMessageAt?.toISOString() ?? null,
      lastHumanMessageAt: r.lastHumanMessageAt?.toISOString() ?? null,
      staleMarkedAt: r.staleMarkedAt?.toISOString() ?? null,
      updatedAt: r.updatedAt.toISOString(),
      contextJson: r.contextJson,
      user: r.user,
      pendingHandoff: r.handoffs[0] ?? null,
      lastMessage: r.messages[0]
        ? {
            senderType: r.messages[0].senderType,
            text: r.messages[0].messageText.slice(0, 280),
            createdAt: r.messages[0].createdAt.toISOString(),
            isNudge: r.messages[0].isNudge,
            isAssistClose: r.messages[0].isAssistClose,
            templateKey: r.messages[0].templateKey,
            handoffRequired: r.messages[0].handoffRequired,
            detectedObjection: r.messages[0].detectedObjection,
          }
        : null,
    };
    }),
    metrics: {
      objectionBreakdown: objectionBreakdown.map((o) => ({
        objection: o.detectedObjection,
        count: o._count.id,
      })),
      outcomeBreakdown: outcomeBreakdown.map((o) => ({
        outcome: o.outcome,
        count: o._count.id,
      })),
      templatePerformance: templatePerformance.map((t) => ({
        templateKey: t.templateKey,
        sent: t.sent,
        replyAfter: t.replyAfter,
        conversionBooked: t.conversionBooked,
      })),
      stageBreakdown: stageBreakdown.map((s) => ({ stage: s.stage, count: s._count.id })),
      stageAnalytics,
      closingStage: {
        total: closingStageTotal,
        booked: closingStageBooked,
        successRate: closingStageSuccessRate,
      },
      totals: {
        conversationsOpen: totalOpen,
        engaged: engagedCount,
        replied: engagedCount,
        booked: outcomeBooked,
        handoff: outcomeHandoff,
        stale: outcomeStale,
        highIntent: highIntentTotal,
        replyRate: fiveRates.replyRate,
        highIntentRate: fiveRates.highIntentRate,
        conversionRate: fiveRates.conversionRate,
        handoffRate: fiveRates.handoffRate,
        staleRate: fiveRates.staleRate,
        bookingRate: fiveRates.conversionRate,
        highIntentConversion: safeDiv(highIntentBooked, highIntentTotal),
      },
      opsPlaybook: opsReport,
    },
  });
}

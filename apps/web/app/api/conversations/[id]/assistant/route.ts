import { NextRequest, NextResponse } from "next/server";
import { MessageType, PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import {
  canAccessConversationContext,
  canViewConversation,
} from "@/modules/messaging/services/messaging-permissions";
import { runConversationAiEngine } from "@/modules/messaging/analysis/conversation-ai.engine";
import {
  buildMemorySnapshot,
  loadClientMemoryRow,
  mergeAssistantHeuristicSnapshot,
  type AssistantHeuristicSnapshotV1,
} from "@/modules/crm-memory/memory.engine";
import { getNextBestAction, type AssistantConversationShape } from "@/modules/messaging/assistant/next-action.service";
import { generateMessageSuggestion } from "@/modules/messaging/assistant/message-suggestion.service";
import { analyzeVoiceMessage } from "@/modules/messaging/voice/voice-analysis.service";
import { recordConversationActionAssignment } from "@/modules/messaging/assistant/conversation-action-assignment.service";
import { messagingAiLog } from "@/modules/messaging/assistant/messaging-ai-logger";
import { extractPreferencesFromTexts } from "@/modules/crm-memory/preference.extractor";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const BROKER_LIKE = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

function buildHeuristicSnapshotV1(
  result: Awaited<ReturnType<typeof runConversationAiEngine>>,
  hasBudgetFromExtraction: boolean
): AssistantHeuristicSnapshotV1 {
  const priceO = result.objections.objections.filter((o) => o.type === "price" && o.severity !== "low");
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    source: "assistant_engine",
    dominantObjection: result.objections.dominantObjection,
    budgetConfidence: priceO.length > 0 ? "low" : hasBudgetFromExtraction ? "high" : "medium",
    financingReadinessHint: result.objections.objections.some((o) => o.type === "financing")
      ? "uncertain"
      : "unknown",
    urgencyLevel:
      result.closingReadiness.label === "near_closing"
        ? "high"
        : result.closingReadiness.label === "not_ready"
          ? "low"
          : "medium",
    propertyFitIssue: result.objections.objections.some((o) => o.type === "property_fit"),
  };
}

/**
 * Suggestion-only assistant. GET returns best-effort suggestions (never auto-sends). POST records broker actions.
 */
export async function GET(_req: NextRequest, context: Params) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 401 });
    if (!BROKER_LIKE.has(user.role)) {
      return NextResponse.json({ ok: false, error: "Assistant is available to brokers" }, { status: 403 });
    }

    const { id: conversationId } = await context.params;
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
        listing: { select: { id: true } },
        fsboListing: { select: { id: true } },
      },
    });
    if (!conv) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    if (!canViewConversation(user, conv, conv.participants)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    if (!(await canAccessConversationContext(user, conv))) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const counterpartyId = conv.participants.map((p) => p.userId).find((uid) => uid !== userId) ?? null;
    const rows = await prisma.message.findMany({
      where: { conversationId, deletedAt: null, messageType: { not: "SYSTEM" } },
      orderBy: { createdAt: "asc" },
      take: 200,
      select: {
        body: true,
        senderId: true,
        createdAt: true,
        messageType: true,
        metadata: true,
      },
    });

    const hasListingContext =
      Boolean(conv.listing) || Boolean(conv.fsboListing) || conv.type === "LISTING";
    if (!counterpartyId) {
      return NextResponse.json(
        {
          ok: true,
          assistant: {
            sentiment: "NEUTRAL",
            dealPrediction: { dealProbability: 0, engagementScore: 0 },
            conversationInsights: [],
            objections: { objections: [], dominantObjection: null as string | null },
            dealStage: { stage: "new" as const, confidence: 0, rationale: [] },
            riskHeatmap: { overallRisk: "low" as const, riskScore: 0, risks: [] },
            closingReadiness: { score: 0, label: "not_ready" as const, rationale: [] },
            coaching: {
              coaching: [] as {
                title: string;
                priority: string;
                rationale: string[];
                recommendedAction: string;
                suggestedApproach?: string;
              }[],
              topCoachingPriority: null as string | null,
            },
            nextBestAction: { action: "Add a contact to the thread", priority: "low" as const, rationale: [] },
            suggestedMessage: {
              message: "",
              tone: "professional" as const,
              goal: "n/a",
              reason: "No message draft when there is no counterparty.",
              goalType: "general_checkin" as const,
            },
            insightsSummary: {
              headline: "No counterparty in thread",
              dealStatus: "n/a",
              objections: [] as string[],
              voice: null,
            },
          },
        },
        { status: 200 }
      );
    }

    const engineMessages = rows.map((r) => ({
      body: r.messageType === "VOICE" ? (typeof r.body === "string" ? r.body : "") : r.body,
      senderId: r.senderId,
      createdAt: r.createdAt.toISOString(),
    }));
    const texts = rows.map((r) => r.body).filter(Boolean);
    const memory = await buildMemorySnapshot({
      clientId: counterpartyId,
      brokerId: userId,
      messageTexts: texts,
    });
    const extracted = extractPreferencesFromTexts(texts);
    let hasBudgetFromExtraction = Boolean(
      (extracted.budgetLabel && extracted.budgetLabel.trim().length > 0) || memory.profile.budget
    );
    const memRow = await loadClientMemoryRow(counterpartyId, userId);
    if (memRow?.preferences && typeof memRow.preferences === "object") {
      const p = (memRow.preferences as Record<string, unknown>).budget;
      if (typeof p === "string" && p.trim().length > 0) hasBudgetFromExtraction = true;
    }
    const last = rows[rows.length - 1] ?? null;
    const lastActivityAt = last?.createdAt.toISOString() ?? conv.updatedAt.toISOString();
    let lastMessageFromViewer: boolean | undefined;
    if (last) {
      if (last.senderId === userId) lastMessageFromViewer = true;
      else if (last.senderId === counterpartyId) lastMessageFromViewer = false;
    }
    const ac: AssistantConversationShape = {
      id: conversationId,
      type: conv.type,
      lastActivityAt,
      lastMessageFromViewer,
    };
    const ai = runConversationAiEngine({
      conversation: ac,
      memory,
      messages: engineMessages,
      viewerId: userId,
      counterpartyId,
    });
    const analysis = {
      sentiment: ai.sentiment,
      dealProbability: ai.dealPrediction.dealProbability,
      engagementScore: ai.dealPrediction.engagementScore,
      insights: ai.conversationInsights,
    };
    const nextBestAction = getNextBestAction(
      { ...ac, type: hasListingContext && !ac.type ? "LISTING" : ac.type },
      {
        sentiment: analysis.sentiment,
        engagementScore: analysis.engagementScore,
        dealProbability: analysis.dealProbability,
        insights: analysis.insights,
      },
      memory
    );
    const suggested = generateMessageSuggestion({
      conversation: { ...ac, type: hasListingContext && !ac.type ? "LISTING" : ac.type },
      memory,
      analysis: {
        sentiment: analysis.sentiment,
        engagementScore: analysis.engagementScore,
        dealProbability: analysis.dealProbability,
        insights: analysis.insights,
      },
      hasListingContext,
      nextBestActionOverride: nextBestAction,
      dealStageKey: ai.dealStage.stage,
      dominantObjection: ai.objections.dominantObjection,
      riskOverall: ai.riskHeatmap.overallRisk,
      coachingTop: ai.coaching.topCoachingPriority,
    });
    const oneHourAgo = Date.now() - 3_600_000;
    const recentThreadMessageCount1h = rows.filter((m) => m.createdAt.getTime() >= oneHourAgo).length;
    const lastVoice = [...rows].reverse().find((m) => m.messageType === MessageType.VOICE);
    let lastVoiceMeta: { durationSec: number; recentThreadMessageCount1h: number } | null = null;
    if (lastVoice) {
      const meta = lastVoice.metadata;
      const durationSec = meta && typeof meta === "object" && "durationSec" in meta ? Number((meta as { durationSec?: unknown }).durationSec) : 5;
      if (Number.isFinite(durationSec) && durationSec > 0) {
        lastVoiceMeta = { durationSec, recentThreadMessageCount1h };
      }
    }
    const lastVoiceAnalysis = lastVoiceMeta ? analyzeVoiceMessage(lastVoiceMeta) : null;
    const d = analysis.dealProbability;
    const dealStatus =
      d >= 65
        ? "Active interest"
        : d >= 40
          ? "Building"
          : analysis.sentiment === "NEGATIVE" && d < 45
            ? "Needs a gentle, clarifying follow-up"
            : "Exploratory / early";
    const summaryObjections: string[] = [
      ...ai.objections.objections
        .slice(0, 3)
        .map(
          (o) =>
            `${o.type} (${(o.confidence * 100).toFixed(0)}% class confidence; heuristic) — not a person label.`
        ),
    ];
    if (summaryObjections.length === 0) {
      summaryObjections.push(
        "No strong single-objection class from the keyword pass; still read the latest messages yourself."
      );
    }
    const insightsSummary = {
      headline: `Heuristic outlook: ${analysis.sentiment} tone · about ${d}% next-step fit (not a guarantee).`,
      dealStatus,
      objections: summaryObjections,
      voice: lastVoiceAnalysis,
    };
    const snap = buildHeuristicSnapshotV1(ai, hasBudgetFromExtraction);
    await mergeAssistantHeuristicSnapshot({ clientId: counterpartyId, brokerId: userId, snapshot: snap });

    return NextResponse.json(
      {
        ok: true,
        assistant: {
          sentiment: ai.sentiment,
          dealPrediction: ai.dealPrediction,
          conversationInsights: ai.conversationInsights,
          objections: ai.objections,
          dealStage: ai.dealStage,
          riskHeatmap: ai.riskHeatmap,
          closingReadiness: ai.closingReadiness,
          coaching: ai.coaching,
          nextBestAction,
          suggestedMessage: {
            message: suggested.message,
            tone: suggested.tone,
            goal: suggested.goal,
            reason: suggested.reason,
            goalType: suggested.goalType,
          },
          insightsSummary,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      {
        ok: true,
        warning: e instanceof Error ? e.message : "assistant_degraded",
        assistant: {
          sentiment: "NEUTRAL" as const,
          dealPrediction: { dealProbability: 0, engagementScore: 0 },
          conversationInsights: [
            "The assistant used a simple fallback. Nothing was sent automatically. Not legal or financial advice.",
          ],
          objections: { objections: [], dominantObjection: null as string | null },
          dealStage: { stage: "new" as const, confidence: 0, rationale: [] },
          riskHeatmap: { overallRisk: "low" as const, riskScore: 0, risks: [] },
          closingReadiness: { score: 0, label: "not_ready" as const, rationale: [] },
          coaching: { coaching: [], topCoachingPriority: null as string | null },
          nextBestAction: {
            action: "Open the thread and review recent messages",
            priority: "low" as const,
            rationale: ["Simplified output while the deeper pass was unavailable."],
          },
          suggestedMessage: {
            message:
              "If it helps, I can suggest a short, neutral line for you to edit and send when you are ready (you always choose what to send).",
            tone: "professional" as const,
            goal: "safety fallback",
            reason: "A neutral template while heuristics were limited.",
            goalType: "general_checkin" as const,
          },
          insightsSummary: { headline: "Heuristics limited", dealStatus: "Unknown", objections: [] as string[], voice: null },
        },
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest, context: Params) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });
    if (!BROKER_LIKE.has(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: conversationId } = await context.params;
    const conv = await prisma.conversation.findUnique({ where: { id: conversationId }, include: { participants: true } });
    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canViewConversation(user, conv, conv.participants)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!(await canAccessConversationContext(user, conv))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      event?: "suggestion_used" | "action_executed";
      actionLabel?: string;
      messagePreview?: string;
    };
    if (body.event !== "suggestion_used" && body.event !== "action_executed") {
      return NextResponse.json({ ok: false, error: "event required" }, { status: 400 });
    }

    if (body.event === "suggestion_used") {
      messagingAiLog.suggestionUsed({ conversationId, hasPreview: Boolean(body.messagePreview) });
    } else {
      messagingAiLog.actionNoted({ conversationId, hasLabel: Boolean(body.actionLabel) });
    }

    const detail: Record<string, unknown> = {
      actionLabel: body.actionLabel ?? null,
      messagePreview: (body.messagePreview ?? "").slice(0, 400),
    };
    void recordConversationActionAssignment({
      userId,
      conversationId,
      event: body.event,
      detail,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true, recorded: "queued" });
  }
}

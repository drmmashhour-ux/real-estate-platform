import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { loadTemplate, personalizeTemplate, type ReplyContext } from "@/src/modules/messaging/aiReplyEngine";
import { isSilentNudgeEnabled } from "@/src/services/growthAiAutoReply";
import { markStaleOutcomes } from "@/src/modules/messaging/outcomes";

type ContextJson = {
  city?: string;
  listing_title?: string;
  last_action?: string;
};

function replyContextFromUser(
  u: { name: string | null; email: string } | null,
  ctx: ContextJson | null
): ReplyContext {
  const name = u?.name?.trim() || u?.email?.split("@")[0] || "there";
  return {
    name,
    city: ctx?.city ?? "your area",
    listing_title: ctx?.listing_title ?? "this listing",
  };
}

/**
 * One silent “ghosting” nudge per conversation: 24h+ since last AI, no user reply after last AI,
 * handoff / human takeover excluded. `closing` stage uses stronger `closing_nudge` even if high-intent.
 */
export async function processSilentNudgeQueue(limit = 20): Promise<{ nudgesSent: number; skipped: number }> {
  if (!isSilentNudgeEnabled()) return { nudgesSent: 0, skipped: 0 };

  const hours = Math.max(1, Number(process.env.AI_SILENT_NUDGE_AFTER_HOURS ?? 24));
  const aiQuietCutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  const candidates = await prisma.growthAiConversation.findMany({
    where: {
      status: "open",
      humanTakeoverAt: null,
      silentNudgeSentAt: null,
      userId: { not: null },
      aiReplyPending: false,
      lastAutomatedAt: { not: null },
      AND: [
        {
          OR: [{ highIntent: false }, { stage: "closing" }],
        },
        {
          OR: [{ outcome: null }, { outcome: { in: ["new", "replied", "qualified"] } }],
        },
        {
          OR: [
            { lastAiMessageAt: { not: null, lte: aiQuietCutoff } },
            { lastAiMessageAt: null, lastAutomatedAt: { lte: aiQuietCutoff } },
          ],
        },
      ],
    },
    take: limit * 5,
    orderBy: { lastAutomatedAt: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  let nudgesSent = 0;
  let skipped = 0;

  for (const c of candidates) {
    if (nudgesSent >= limit) break;

    const tplKey = c.stage === "closing" ? "closing_nudge" : "ghosting_follow_up";
    const tpl = await loadTemplate(tplKey);
    if (!tpl) {
      skipped++;
      continue;
    }

    const pendingHandoff = await prisma.growthAiConversationHandoff.count({
      where: { conversationId: c.id, status: "pending" },
    });
    if (pendingHandoff > 0) {
      skipped++;
      continue;
    }

    const lastMsg = await prisma.growthAiConversationMessage.findFirst({
      where: { conversationId: c.id },
      orderBy: { createdAt: "desc" },
    });

    if (!lastMsg || lastMsg.senderType !== "ai") {
      skipped++;
      continue;
    }
    if (lastMsg.handoffRequired || lastMsg.templateKey === "handoff_ack") {
      skipped++;
      continue;
    }
    if (
      lastMsg.templateKey === "silent_follow_up" ||
      lastMsg.templateKey === "ghosting_follow_up" ||
      lastMsg.templateKey === "closing_nudge" ||
      lastMsg.isNudge
    ) {
      skipped++;
      continue;
    }

    const ctxJson = (c.contextJson as ContextJson | null) ?? {};
    const replyCtx = replyContextFromUser(c.user, ctxJson);
    const text = personalizeTemplate(tpl.content, replyCtx);

    const nudgeAt = new Date();
    await prisma.$transaction([
      prisma.growthAiConversationMessage.create({
        data: {
          conversationId: c.id,
          senderType: "ai",
          messageText: text,
          templateKey: tplKey,
          ctaType: tpl.ctaType,
          isNudge: true,
        },
      }),
      prisma.growthAiConversation.update({
        where: { id: c.id },
        data: {
          silentNudgeSentAt: nudgeAt,
          lastAutomatedAt: nudgeAt,
          lastAiMessageAt: nudgeAt,
          growthAiOutcome: "silent_nudge_sent",
          growthAiOutcomeAt: nudgeAt,
        },
      }),
    ]);
    nudgesSent++;
    logInfo("Silent nudge sent", { conversationId: c.id, template: tplKey });
  }

  return { nudgesSent, skipped };
}

export async function runSilentNudgeAndStalePass(limit = 25): Promise<{
  nudgesSent: number;
  nudgesSkipped: number;
  staleMarked: number;
}> {
  const nudge = await processSilentNudgeQueue(limit);
  const staleMarked = await markStaleOutcomes(200);
  return { nudgesSent: nudge.nudgesSent, nudgesSkipped: nudge.skipped, staleMarked };
}

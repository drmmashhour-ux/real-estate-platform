import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

import { getOrCreateBrokerExecutionSettings, queueExecutionTask } from "./autonomous-execution.engine";

/**
 * Proposes execution tasks from CRM, deals, closings, investor pipeline, and finance signals.
 * Respects broker execution mode (OFF → no new queued work).
 */
export async function generateExecutionTasksForBroker(brokerUserId: string): Promise<{ created: number; skippedReason?: string }> {
  const settings = await getOrCreateBrokerExecutionSettings(brokerUserId);
  if (settings.mode === "OFF") {
    return { created: 0, skippedReason: "mode_off" };
  }

  let created = 0;

  const deals = await prisma.deal.findMany({
    where: {
      brokerId: brokerUserId,
      NOT: { status: { in: ["closed", "cancelled"] } },
    },
    take: 18,
    orderBy: { updatedAt: "desc" },
    include: {
      closeProbabilities: { orderBy: { createdAt: "desc" }, take: 1 },
      dealScores: { orderBy: { createdAt: "desc" }, take: 1 },
      lecipmClosingChecklistItems: { where: { status: "BLOCKED" }, take: 2 },
    },
  });

  for (const d of deals) {
    const cp = d.closeProbabilities[0]?.probability ?? 0;
    const score = d.dealScores[0]?.score ?? 0;
    if (cp >= 0.62 || score >= 78) {
      const q = await queueExecutionTask({
        brokerUserId,
        taskType: "OFFER_PREP",
        entityType: "DEAL",
        entityId: d.id,
        payloadJson: { dealCode: d.dealCode, priceCents: d.priceCents },
        aiReasoningJson: {
          summary: "High momentum deal — prepare offer draft for broker review (no automatic dispatch).",
          closeProbability: cp,
          dealScore: score,
        },
        priorityScore: 60 + cp * 35 + Math.min(20, score / 5),
      });
      if (q.isNew) created += 1;
    }

    if (d.status === "CONFLICT_REQUIRES_DISCLOSURE") {
      const q = await queueExecutionTask({
        brokerUserId,
        taskType: "DISCLOSURE_PREP",
        entityType: "DEAL",
        entityId: d.id,
        payloadJson: { dealCode: d.dealCode },
        aiReasoningJson: {
          summary: "Conflict disclosure prep — supervised workflow; no outbound send from automation.",
        },
        priorityScore: 95,
      });
      if (q.isNew) created += 1;
    }

    if (d.lecipmClosingChecklistItems.length > 0) {
      const q = await queueExecutionTask({
        brokerUserId,
        taskType: "NOTARY_REMINDER",
        entityType: "CLOSING",
        entityId: d.id,
        payloadJson: { blockedTitles: d.lecipmClosingChecklistItems.map((x) => x.title) },
        aiReasoningJson: {
          summary: "Closing checklist has blocked items — prep notary / signing reminders internally.",
        },
        priorityScore: 80,
      });
      if (q.isNew) created += 1;
    }

    if (score >= 70 && cp < 0.35) {
      const q = await queueExecutionTask({
        brokerUserId,
        taskType: "DEAL_STAGE_PREP",
        entityType: "DEAL",
        entityId: d.id,
        payloadJson: { suggestedStage: "follow_up_intensive" },
        aiReasoningJson: {
          summary: "Strong file score but probability lagging — review next CRM stage and blockers.",
        },
        priorityScore: 45 + score * 0.2,
      });
      if (q.isNew) created += 1;
    }
  }

  const leads = await prisma.lead.findMany({
    where: { introducedByBrokerId: brokerUserId },
    take: 15,
    orderBy: { score: "desc" },
  });

  for (const lead of leads) {
    if (lead.score < 55) continue;
    const convo = await prisma.crmConversation.findFirst({
      where: { leadId: lead.id },
      select: { id: true, priorityScore: true, intentScore: true },
    });
    if (convo) {
      const q = await queueExecutionTask({
        brokerUserId,
        taskType: "MESSAGE",
        entityType: "CONVERSATION",
        entityId: convo.id,
        payloadJson: {
          suggestedBody: `Hi ${lead.name.split(" ")[0] ?? ""} — checking in on your property search. Can we schedule a quick call?`,
          leadId: lead.id,
        },
        aiReasoningJson: {
          summary: "Warm/hot CRM thread — draft reply only; broker reviews before any send.",
          leadScore: lead.score,
          intentScore: convo.intentScore,
        },
        priorityScore: lead.score + convo.priorityScore * 0.4 + convo.intentScore * 0.3,
      });
      if (q.isNew) created += 1;
    } else {
      const q = await queueExecutionTask({
        brokerUserId,
        taskType: "FOLLOW_UP",
        entityType: "CONVERSATION",
        entityId: `lead:${lead.id}`,
        payloadJson: { leadId: lead.id, title: `Follow up: ${lead.name}` },
        aiReasoningJson: {
          summary: "High-score lead without active chat thread — create internal follow-up task.",
          leadScore: lead.score,
        },
        priorityScore: lead.score,
      });
      if (q.isNew) created += 1;
    }
  }

  const investors = await prisma.lecipmPipelineDeal.findMany({
    where: { brokerId: brokerUserId },
    take: 8,
    orderBy: { updatedAt: "desc" },
  });
  for (const p of investors) {
    if (!/PROPOSED|PENDING|REVIEW/i.test(p.decisionStatus)) continue;
    const q = await queueExecutionTask({
      brokerUserId,
      taskType: "INVESTOR_PACKET_PREP",
      entityType: "PACKET",
      entityId: p.id,
      payloadJson: { pipelineTitle: p.title, listingId: p.listingId },
      aiReasoningJson: {
        summary: "Investor workflow — prep packet draft; no public solicitation or unsupervised release.",
        stage: p.pipelineStage,
        decisionStatus: p.decisionStatus,
      },
      priorityScore: 58,
    });
    if (q.isNew) created += 1;
  }

  const accesses = await prisma.brokerListingAccess.findMany({
    where: { brokerId: brokerUserId },
    take: 6,
    orderBy: { grantedAt: "desc" },
    include: { listing: true },
  });
  for (const a of accesses) {
    const l = a.listing;
    const q = await queueExecutionTask({
      brokerUserId,
      taskType: "PRICE_UPDATE_PREP",
      entityType: "LISTING",
      entityId: l.id,
      payloadJson: { listingId: l.id, proposedAdjustment: "Review comps — AI advisory only." },
      aiReasoningJson: {
        summary: "Periodic pricing review suggestion — broker applies changes manually after validation.",
      },
      priorityScore: 35,
    });
    if (q.isNew) created += 1;
  }

  return { created };
}

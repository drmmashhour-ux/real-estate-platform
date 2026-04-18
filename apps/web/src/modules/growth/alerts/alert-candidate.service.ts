import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import { toScore100 } from "../growth.scoring";

/**
 * Re-engagement *candidates* only — no messages sent. Ops or a future sender applies with consent checks.
 */
export async function scanReengagementAlertCandidates(limit = 80): Promise<{ rows: number }> {
  if (!engineFlags.reengagementCandidatesV1 || !engineFlags.growthAutopilotV1) {
    return { rows: 0 };
  }

  const staleLeads = await prisma.lead.findMany({
    where: {
      pipelineStatus: { notIn: ["won", "lost", "closed"] },
      OR: [{ lastFollowUpAt: null }, { lastFollowUpAt: { lt: new Date(Date.now() - 7 * 86400000) } }],
    },
    take: limit,
    select: { id: true, email: true, assignedExpertId: true },
  });

  const since = new Date(Date.now() - 3 * 86400000);
  let rows = 0;
  for (const l of staleLeads) {
    const dup = await prisma.growthOpportunityCandidate.findFirst({
      where: {
        type: "send_broker_followup_reminder",
        targetType: "lead",
        targetId: l.id,
        createdAt: { gte: since },
      },
    });
    if (dup) continue;
    await prisma.growthOpportunityCandidate.create({
      data: {
        type: "send_broker_followup_reminder",
        targetType: "lead",
        targetId: l.id,
        score: toScore100(0.55),
        reason: "Lead without recent broker follow-up (candidate only).",
        metadataJson: { hasAssignee: Boolean(l.assignedExpertId), source: "growth_alerts_v1" },
        status: "pending",
      },
    });
    rows++;
  }

  return { rows };
}

import { prisma } from "@/lib/db";
import { createAlert } from "@/lib/monitoring/alerts";
import type { MonitoringOwner } from "@/lib/monitoring/resolve-owner";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

/** Alert when model score is strictly above 80 (advisory; not a buy signal). */
const HIGH_SCORE_THRESHOLD = 80;

/** Alert Center advisory when a scored deal crosses the high-opportunity band (human review; not a buy signal). */
export async function alertOnHighDealScore(candidateId: string, owner: MonitoringOwner, actorUserId: string) {
  const deal = await prisma.dealCandidate.findUnique({ where: { id: candidateId } });
  if (!deal?.dealScore || deal.dealScore <= HIGH_SCORE_THRESHOLD || deal.highOpportunityAlerted) return;

  await createAlert({
    ownerType: owner.ownerType,
    ownerId: owner.ownerId,
    alertType: "deal_finder",
    severity: "info",
    title: "High opportunity deal (model score)",
    message: `Deal candidate at ${deal.address} scored ${Math.round(deal.dealScore)} (${deal.dealLabel ?? deal.dealType ?? "deal"}). Advisory only — confirm metrics, appraisal, and diligence; not a purchase recommendation.`,
    referenceType: "deal_candidate",
    referenceId: deal.id,
    metadata: {
      listingId: deal.listingId,
      dealScore: deal.dealScore,
      lowConfidence: deal.lowConfidence,
    },
  });

  await prisma.dealCandidate.update({
    where: { id: deal.id },
    data: { highOpportunityAlerted: true },
  });

  await recordAuditEvent({
    actorUserId,
    action: "DEAL_FINDER_HIGH_SCORE_ALERT",
    payload: { dealCandidateId: deal.id, dealScore: deal.dealScore },
  });
}

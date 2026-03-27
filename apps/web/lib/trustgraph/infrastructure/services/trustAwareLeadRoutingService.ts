import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { getPhase5GrowthConfig } from "@/lib/trustgraph/config/phase5-growth";
import type { BrokerRoutingFactor, TrustAwareLeadRoutingResult } from "@/lib/trustgraph/domain/leadRouting";

/**
 * Ranks platform broker user ids using TrustGraph BROKER cases when present.
 * Always returns a full ordering — non-verified brokers keep a configurable floor weight.
 */
export async function rankBrokerUsersForLeadRouting(candidateUserIds: string[]): Promise<TrustAwareLeadRoutingResult> {
  const cfg = getPhase5GrowthConfig().leadRouting;
  if (candidateUserIds.length === 0) {
    return {
      recommendedBrokerIds: [],
      routingFactors: [],
      trustContribution: 0,
      fallbackReason: "no_candidates",
    };
  }

  const cases = await prisma.verificationCase.findMany({
    where: { entityType: "BROKER", entityId: { in: candidateUserIds } },
    orderBy: { updatedAt: "desc" },
    select: {
      entityId: true,
      overallScore: true,
      updatedAt: true,
    },
  });
  const caseByUser = new Map<string, { overallScore: number | null }>();
  for (const c of cases) {
    if (!caseByUser.has(c.entityId)) {
      caseByUser.set(c.entityId, { overallScore: c.overallScore });
    }
  }

  const ruleRows = await prisma.verificationRuleResult.findMany({
    where: {
      case: { entityType: "BROKER", entityId: { in: candidateUserIds } },
      ruleCode: "BROKER_LICENSE_PRESENT_RULE",
    },
    select: { passed: true, case: { select: { entityId: true } } },
    orderBy: { createdAt: "desc" },
  });
  const licensePass = new Map<string, boolean>();
  for (const r of ruleRows) {
    const uid = r.case.entityId;
    if (!licensePass.has(uid)) {
      licensePass.set(uid, r.passed);
    }
  }

  const users = await prisma.user.findMany({
    where: { id: { in: candidateUserIds }, role: "BROKER" },
    select: { id: true, brokerStatus: true, createdAt: true },
  });
  const userById = new Map(users.map((u) => [u.id, u]));

  const factors: BrokerRoutingFactor[] = [];
  for (const id of candidateUserIds) {
    const u = userById.get(id);
    if (!u) continue;
    const oc = caseByUser.get(id)?.overallScore ?? null;
    const trustScoreComponent = (oc ?? 50) * cfg.trustScoreWeight;
    const verifiedBonus =
      u.brokerStatus === "VERIFIED" ? cfg.brokerVerifiedBonus : cfg.minNonVerifiedWeight * cfg.brokerVerifiedBonus;
    const licenseRulePass = licensePass.get(id) ?? false;
    const licenseBonus = licenseRulePass ? cfg.licenseRulePassBonus : 0;
    const routingScore = trustScoreComponent + verifiedBonus + licenseBonus;

    factors.push({
      userId: id,
      routingScore,
      trustScoreComponent,
      verificationBonus: verifiedBonus,
      licenseRulePass,
    });
  }

  factors.sort((a, b) => b.routingScore - a.routingScore);
  const recommendedBrokerIds = factors.map((f) => f.userId);
  const trustContribution = factors.length > 0 ? factors[0]!.trustScoreComponent : 0;

  void recordPlatformEvent({
    eventType: "trustgraph_lead_routing_decision",
    sourceModule: "trustgraph",
    entityType: "USER",
    entityId: recommendedBrokerIds[0] ?? "none",
    payload: {
      candidateCount: candidateUserIds.length,
      topBrokerId: recommendedBrokerIds[0] ?? null,
      trustContribution,
    },
  }).catch(() => {});

  return {
    recommendedBrokerIds,
    routingFactors: factors,
    trustContribution,
    fallbackReason: null,
  };
}

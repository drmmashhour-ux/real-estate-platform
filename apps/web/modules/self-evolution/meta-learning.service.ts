import { prisma } from "@repo/db";
import { getDefaultPolicySnapshot, parsePolicyFromDb } from "./evolution-policy-defaults";
import { selfEvolutionLog } from "./self-evolution-logger";
import type { MetaLearningInsight } from "./self-evolution.types";

const DISCLAIMER =
  "Meta-signals are observational. No guarantee that future evolutions will repeat past outcomes; governance policy always applies first.";

/**
 * Aggregates promotion / rollback / experiment rows into dashboard-friendly insight.
 */
export async function buildMetaLearningInsights(): Promise<MetaLearningInsight> {
  const pol = parsePolicyFromDb(
    (await prisma.evolutionPolicy.findFirst({ where: { isActive: true, scopeType: "GLOBAL" } })) as Parameters<typeof parsePolicyFromDb>[0]
  );
  const pdef = getDefaultPolicySnapshot();
  const empty: MetaLearningInsight = {
    mostEffective: [],
    failed: [],
    rollbackProne: [],
    strongestDomains: [],
    confidence: { summary: "low — sparse ledger", score: 0.2 },
    disclaimer: DISCLAIMER,
    policySummary: {
      allowedAuto: pol.allowedSelfPromotionCategories,
      needApproval: pol.approvalRequiredCategories,
      blocked: pol.blockedSemanticTags,
      maxAutoRisk: pol.maxAutoPromoteRiskLevel ?? pdef.maxAutoPromoteRiskLevel,
    },
    evolutionPolicyScope: { scopeType: pol.scopeType, scopeKey: pol.scopeKey },
  };
  try {
    const [prom, roll, prows] = await Promise.all([
      prisma.evolutionProposal.findMany({ where: { status: "PROMOTED" }, take: 12, orderBy: { createdAt: "desc" } }),
      prisma.evolutionProposal.findMany({ where: { status: "ROLLED_BACK" }, take: 20, orderBy: { createdAt: "desc" } }),
      prisma.evolutionProposal.findMany({ where: { status: "REJECTED" }, take: 8, orderBy: { createdAt: "desc" } }),
    ]);
    const rbc: Record<string, number> = {};
    for (const r of roll) {
      rbc[r.category] = (rbc[r.category] ?? 0) + 1;
    }
    const byCat = Object.entries(rbc)
      .sort((a, b) => b[1]! - a[1]!)
      .slice(0, 4);
    for (const c of prows) {
      empty.failed.push({ proposalId: c.id, category: c.category, note: "rejected in govern path" });
    }
    for (const x of prom.slice(0, 4)) {
      empty.mostEffective.push({
        proposalId: x.id,
        category: x.category,
        versionKey: x.proposedVersionKey,
        note: "promotion exists in evolution ledger; subsystem activation may be separate",
      });
    }
    for (const [k, c] of byCat) {
      empty.rollbackProne.push({ category: k, count: c, note: "rollbacks in window" });
    }
    const conf = prows.length + prom.length + roll.length > 6 ? 0.45 : 0.2;
    empty.confidence = { summary: "bounded by count of events", score: conf };
    selfEvolutionLog.meta({ prom: prom.length, roll: roll.length });
  } catch (e) {
    selfEvolutionLog.warn("buildMeta", { err: e instanceof Error ? e.message : String(e) });
  }
  return empty;
}

import { prisma } from "@/lib/db";
import type { CeoDecisionProposal, CeoMarketSignals } from "@/modules/ceo-ai/ceo-ai.types";

/** Rank prospects & drafts only — bulk send never auto-executes. */

export async function proposeOutreachDecisions(signals: CeoMarketSignals): Promise<CeoDecisionProposal[]> {
  const out: CeoDecisionProposal[] = [];

  const thirty = new Date();
  thirty.setDate(thirty.getDate() - 30);

  const rows = await prisma.seniorResidence.groupBy({
    by: ["city"],
    where: { operatorId: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 12,
  });

  const hotCity = rows[0]?.city;
  if (
    hotCity &&
    signals.demandIndex > 0.58 &&
    signals.leadsLast30d > signals.leadsPrev30d &&
    signals.outreachReplyRateProxy != null &&
    signals.outreachReplyRateProxy < 0.22
  ) {
    out.push({
      domain: "OUTREACH",
      title: `Prioritize operators in ${hotCity}`,
      summary:
        "Unmet demand concentration + soft reply signals — prioritize manual sequences for verified operators.",
      rationale: `${signals.leadsLast30d} leads vs ${signals.leadsPrev30d} prior window; replies proxy ${signals.outreachReplyRateProxy?.toFixed(2)}.`,
      confidence: 0.66,
      impactEstimate: 0.05,
      requiresApproval: true,
      payload: {
        kind: "outreach_operator_city",
        city: hotCity,
        rationale: "Weighted by residence coverage and demand delta.",
        draftBullets: [
          "Opening: provincial compliance + inbound family demand snapshot",
          "Ask: SLA for lead response windows",
          "Offer: onboarding checkpoint with AM",
        ],
        bulkSend: false,
      },
    });
  }

  const staleOperators = await prisma.seniorResidence.findMany({
    where: {
      leads: {
        some: {
          createdAt: { gte: thirty },
          status: { not: "CLOSED" },
        },
      },
      operatorId: { not: null },
    },
    select: { id: true },
    take: 10,
  });

  if (staleOperators.length >= 4 && signals.leadsLast30d >= 10) {
    out.push({
      domain: "OUTREACH",
      title: "Re-engage operators with accepted-but-unconverted leads",
      summary:
        "Pipeline shows accepted leads without downstream close — concierge-style follow-up beats cold prospecting.",
      rationale: `${staleOperators.length} residences with warm lead inventory in-window.`,
      confidence: 0.61,
      impactEstimate: 0.04,
      requiresApproval: true,
      payload: {
        kind: "outreach_operator_reengage",
        residenceIdsHint: staleOperators.map((x) => x.id),
      },
    });
  }

  if (signals.brokerAccountsApprox > 40 && signals.churnInactiveBrokersApprox > 8) {
    out.push({
      domain: "OUTREACH",
      title: "Tier-1 brokers: dormant but historically strong",
      summary:
        "Route outbound capacity to brokerage accounts showing high CRM score but recent inactivity.",
      rationale: `Approx ${signals.churnInactiveBrokersApprox} inactive broker accounts flagged vs ${signals.brokerAccountsApprox} total.`,
      confidence: 0.57,
      impactEstimate: 0.035,
      requiresApproval: true,
      payload: {
        kind: "outreach_broker_prospects",
        prioritize: "high_score_inactive",
        maxList: 25,
      },
    });
  }

  return out;
}

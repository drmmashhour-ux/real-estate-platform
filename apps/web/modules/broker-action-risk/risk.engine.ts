import { prisma } from "@/lib/db";

export type BrokerApprovalRiskKind = "offer_draft_approve" | "signature_session";

export type RiskFlagRecord = {
  type:
    | "missing_documents"
    | "conflict_of_interest"
    | "abnormal_pricing"
    | "legal_gap"
    | "incomplete_conditions"
    | "investor_compliance"
    | "deal_intelligence"
    | "compliance_case"
    | "qa_review";
  severity: "warning" | "blocker";
  message: string;
};

export type BrokerApprovalRiskResult = {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  warnings: string[];
  blockers: string[];
  flags: RiskFlagRecord[];
};

function clampScore(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function levelFrom(score: number, hasBlocker: boolean): "LOW" | "MEDIUM" | "HIGH" {
  if (hasBlocker || score >= 75) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

/**
 * Advisory + gating signals before broker approval / signature orchestration.
 * Blockers must stop automated approval paths (see offer-draft approve + signature create).
 */
export async function assessBrokerApprovalRisk(input: {
  kind: BrokerApprovalRiskKind;
  dealId: string;
  draftId?: string;
}): Promise<BrokerApprovalRiskResult> {
  const flags: RiskFlagRecord[] = [];
  let score = 0;

  const deal = await prisma.deal.findUnique({
    where: { id: input.dealId },
    select: {
      id: true,
      status: true,
      priceCents: true,
      listingId: true,
      riskLevel: true,
      possibleBypassFlag: true,
      qaReviews: {
        where: { status: { in: ["draft", "pending", "in_progress"] } },
        take: 3,
        select: { id: true },
      },
    },
  });

  if (!deal) {
    return {
      riskScore: 100,
      riskLevel: "HIGH",
      warnings: [],
      blockers: ["Deal not found — cannot assess risk."],
      flags: [{ type: "deal_intelligence", severity: "blocker", message: "Deal not found." }],
    };
  }

  if (deal.status === "CONFLICT_REQUIRES_DISCLOSURE") {
    flags.push({
      type: "conflict_of_interest",
      severity: "blocker",
      message: "Deal is in conflict disclosure state — resolve before approving or signing.",
    });
    score += 45;
  }

  if ((deal.riskLevel ?? "").toUpperCase() === "HIGH") {
    flags.push({
      type: "deal_intelligence",
      severity: "warning",
      message: "Deal intelligence risk level is HIGH — tighten review and documentation.",
    });
    score += 22;
  }

  if (deal.possibleBypassFlag) {
    flags.push({
      type: "deal_intelligence",
      severity: "warning",
      message: "Possible lead bypass flag — confirm brokerage compliance before execution.",
    });
    score += 15;
  }

  if (deal.qaReviews.length > 0) {
    flags.push({
      type: "qa_review",
      severity: "warning",
      message: "Open QA review on file — complete or document waiver before high-risk approvals.",
    });
    score += 18;
  }

  const seriousCompliance = await prisma.complianceCase.count({
    where: {
      dealId: input.dealId,
      severity: { in: ["high", "critical"] },
      status: { notIn: ["resolved", "dismissed", "archived"] },
    },
  });
  if (seriousCompliance > 0) {
    flags.push({
      type: "compliance_case",
      severity: "blocker",
      message: "Open high- or critical-severity compliance case — close or escalate before execution.",
    });
    score += 40;
  }

  const docCount = await prisma.dealDocument.count({ where: { dealId: input.dealId } });
  if (docCount === 0) {
    flags.push({
      type: "missing_documents",
      severity: "warning",
      message: "No deal-room documents uploaded — confirm the file is complete for this stage.",
    });
    score += 12;
  }

  if (!deal.listingId) {
    flags.push({
      type: "missing_documents",
      severity: "warning",
      message: "Deal has no linked listing — confirm property reference before binding offer.",
    });
    score += 10;
  }

  const conditions = await prisma.dealClosingCondition.findMany({
    where: { dealId: input.dealId },
    select: { deadline: true, status: true, fulfilledAt: true },
    take: 80,
  });
  const now = Date.now();
  let overdueOpen = 0;
  for (const c of conditions) {
    const open = c.status !== "fulfilled" && !c.fulfilledAt;
    if (open && c.deadline && c.deadline.getTime() < now) overdueOpen += 1;
  }
  if (overdueOpen > 0) {
    flags.push({
      type: "incomplete_conditions",
      severity: "blocker",
      message: `${overdueOpen} closing condition(s) appear overdue — extend, waive, or fulfil before advancing.`,
    });
    score += 35;
  } else if (conditions.length > 0) {
    const openCount = conditions.filter((c) => c.status !== "fulfilled" && !c.fulfilledAt).length;
    if (openCount > 0) {
      flags.push({
        type: "incomplete_conditions",
        severity: "warning",
        message: `${openCount} closing condition(s) still open — confirm they align with this approval.`,
      });
      score += 10;
    }
  }

  const softInvestors = await prisma.crmDealInvestorCommitment.count({
    where: { dealId: input.dealId, status: "SOFT_COMMIT" },
  });
  if (softInvestors > 0) {
    flags.push({
      type: "investor_compliance",
      severity: "warning",
      message: `${softInvestors} investor soft-commit(s) pending broker confirmation — verify suitability / packet rules.`,
    });
    score += 12;
  }

  if (input.kind === "offer_draft_approve" && input.draftId) {
    const draft = await prisma.offerDraft.findFirst({
      where: { id: input.draftId, dealId: input.dealId },
      select: {
        purchasePrice: true,
        clauseWarningsJson: true,
        financingClauseText: true,
        inspectionClauseText: true,
      },
    });
    if (draft) {
      const ref = Math.max(deal.priceCents / 100, 1);
      const dev = Math.abs(draft.purchasePrice - ref) / ref;
      if (dev > 0.4) {
        flags.push({
          type: "abnormal_pricing",
          severity: "blocker",
          message: `Offer price deviates ${Math.round(dev * 100)}% from deal reference — confirm intentional before approval.`,
        });
        score += 38;
      } else if (dev > 0.25) {
        flags.push({
          type: "abnormal_pricing",
          severity: "warning",
          message: `Offer price deviates ${Math.round(dev * 100)}% from deal reference — document rationale.`,
        });
        score += 18;
      }

      const cw = Array.isArray(draft.clauseWarningsJson) ? (draft.clauseWarningsJson as unknown[]) : [];
      if (cw.length > 0) {
        flags.push({
          type: "legal_gap",
          severity: "warning",
          message: `AI/clause engine reported ${cw.length} warning(s) on this draft — clear or accept explicitly.`,
        });
        score += Math.min(20, 5 * cw.length);
      }

      const fin = (draft.financingClauseText ?? "").trim();
      const ins = (draft.inspectionClauseText ?? "").trim();
      if (fin.length < 20 && ins.length < 20) {
        flags.push({
          type: "legal_gap",
          severity: "warning",
          message: "Financing and inspection clauses look thin — confirm protective language is complete.",
        });
        score += 14;
      }
    }
  }

  score = clampScore(score);
  const blockers = flags.filter((f) => f.severity === "blocker").map((f) => f.message);
  const warnings = flags.filter((f) => f.severity === "warning").map((f) => f.message);
  const hasBlocker = blockers.length > 0;

  return {
    riskScore: hasBlocker ? Math.max(score, 75) : score,
    riskLevel: levelFrom(score, hasBlocker),
    warnings,
    blockers,
    flags,
  };
}

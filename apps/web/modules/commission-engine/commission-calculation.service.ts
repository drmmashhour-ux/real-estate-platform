import { prisma } from "@/lib/db";
import { brokerageOfficeAuditKeys, logBrokerageOfficeAudit } from "@/lib/brokerage/office-audit";
import { runCommissionRuleEngine } from "./commission-rule-engine";
import type { SplitLineInput } from "./commission-engine.types";
import { commissionEngineDisclaimer } from "@/modules/brokerage-office/office-explainer";
import { resolveResidentialTransactionFromDeal } from "./residential-deal-linker.service";

function buildSplitLines(
  officeId: string,
  brokerUserId: string,
  calc: import("./commission-engine.types").CommissionCalculationOutput,
): SplitLineInput[] {
  const lines: SplitLineInput[] = [
    {
      splitCategory: "office_share",
      payeeKind: "office",
      amountCents: calc.officeShareCents,
      notes: { officeId },
    },
    {
      splitCategory: "broker_share",
      payeeKind: "broker",
      payeeUserId: brokerUserId,
      amountCents: calc.brokerShareCents,
    },
  ];
  for (const d of calc.deductions) {
    lines.push({
      splitCategory: "deduction",
      payeeKind: "office",
      amountCents: d.amountCents,
      notes: { key: d.key, label: d.label },
    });
  }
  return lines;
}

export async function runCommissionForDeal(input: {
  dealId: string;
  officeId: string;
  actorUserId: string;
  grossCommissionCents: number;
}) {
  const deal = await prisma.deal.findFirst({
    where: { id: input.dealId },
    include: { broker: { select: { id: true } } },
  });
  if (!deal?.brokerId) {
    return { ok: false as const, error: "Deal has no broker assigned." };
  }

  const residentialLink = resolveResidentialTransactionFromDeal({
    dealExecutionType: deal.dealExecutionType,
  });
  if (!residentialLink.ok) {
    return { ok: false as const, error: residentialLink.error };
  }

  const brokerMember = await prisma.officeMembership.findFirst({
    where: {
      officeId: input.officeId,
      userId: deal.brokerId,
      membershipStatus: "active",
    },
  });
  if (!brokerMember) {
    return { ok: false as const, error: "Listing broker is not an active member of this office." };
  }

  if (!deal.brokerageOfficeId) {
    await prisma.deal.update({
      where: { id: deal.id },
      data: { brokerageOfficeId: input.officeId },
    });
  } else if (deal.brokerageOfficeId !== input.officeId) {
    return { ok: false as const, error: "Deal is attributed to a different brokerage office." };
  }

  const [assignment, officeRow] = await Promise.all([
    prisma.brokerCommissionAssignment.findFirst({
      where: {
        officeId: input.officeId,
        brokerUserId: deal.brokerId,
        effectiveFrom: { lte: new Date() },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
      },
      orderBy: { effectiveFrom: "desc" },
      include: { commissionPlan: true },
    }),
    prisma.brokerageOffice.findUnique({
      where: { id: input.officeId },
      include: { settings: true },
    }),
  ]);

  const fromSettings = officeRow?.settings?.commissionConfig;
  const rawRule =
    (assignment?.overrideConfig as Record<string, unknown> | null) ??
    (assignment?.commissionPlan.ruleConfig as Record<string, unknown>) ??
    (typeof fromSettings === "object" && fromSettings !== null ? (fromSettings as Record<string, unknown>) : {});
  const ruleConfig =
    rawRule && Object.keys(rawRule).length > 0
      ? rawRule
      : { version: 1, officeSharePercent: 30, brokerShareOfRemainderPercent: 100, deductions: [] };

  const engine = runCommissionRuleEngine(input.grossCommissionCents, ruleConfig);
  if (!engine.ok) {
    return { ok: false as const, error: engine.error };
  }

  const breakdown = {
    ...engine.result,
    disclaimer: commissionEngineDisclaimer(),
    ruleSource: assignment ? { planId: assignment.commissionPlanId, assignmentId: assignment.id } : { default: true },
  };

  const existing = await prisma.brokerageCommissionCase.findFirst({
    where: { dealId: input.dealId, officeId: input.officeId },
  });
  if (existing && ["paid", "approved", "invoiced", "payout_ready"].includes(existing.status)) {
    return { ok: false as const, error: "Commission case already advanced — create adjustment workflow." };
  }

  const caseRow = existing
    ? await prisma.brokerageCommissionCase.update({
        where: { id: existing.id },
        data: {
          grossCommissionCents: input.grossCommissionCents,
          brokerUserId: deal.brokerId,
          status: "calculated",
          sourceData: {
            dealId: input.dealId,
            priceCents: deal.priceCents,
            platformCommissionRecordTouched: false,
            residentialLinkWarnings: residentialLink.warnings,
          } as object,
          transactionType: residentialLink.transactionType,
          calculatedBreakdown: breakdown as object,
        },
      })
    : await prisma.brokerageCommissionCase.create({
        data: {
          dealId: input.dealId,
          officeId: input.officeId,
          brokerUserId: deal.brokerId,
          grossCommissionCents: input.grossCommissionCents,
          status: "calculated",
          sourceData: {
            dealId: input.dealId,
            priceCents: deal.priceCents,
            residentialLinkWarnings: residentialLink.warnings,
          } as object,
          transactionType: residentialLink.transactionType,
          calculatedBreakdown: breakdown as object,
        },
      });

  await prisma.brokerageCommissionSplitLine.deleteMany({ where: { commissionCaseId: caseRow.id } });
  const lines = buildSplitLines(input.officeId, deal.brokerId, engine.result);
  await prisma.brokerageCommissionSplitLine.createMany({
    data: lines.map((l) => ({
      commissionCaseId: caseRow.id,
      splitCategory: l.splitCategory,
      payeeKind: l.payeeKind,
      payeeUserId: l.payeeUserId ?? undefined,
      payeeExternalName: l.payeeExternalName ?? undefined,
      amountCents: l.amountCents,
      percentage: l.percentage ?? undefined,
      notes: (l.notes ?? {}) as object,
    })),
  });

  await logBrokerageOfficeAudit({
    officeId: input.officeId,
    actorUserId: input.actorUserId,
    actionKey: brokerageOfficeAuditKeys.commissionCaseCreated,
    payload: { commissionCaseId: caseRow.id, grossCommissionCents: input.grossCommissionCents },
  });

  return {
    ok: true as const,
    case: await prisma.brokerageCommissionCase.findUnique({
      where: { id: caseRow.id },
      include: { splits: true, deal: { select: { id: true, dealCode: true } } },
    }),
    disclaimer: commissionEngineDisclaimer(),
  };
}

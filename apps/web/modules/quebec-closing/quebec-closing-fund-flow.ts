import type { DealClosingFundMilestone, LecipmDealPayment } from "@prisma/client";
import { prisma } from "@/lib/db";

import {
  FUND_MILESTONE_KINDS,
  FUND_MILESTONE_LABELS,
  type ClosingFundMilestoneKind,
} from "./quebec-closing-fund-flow.constants";

export type { ClosingFundMilestoneKind };
export { FUND_MILESTONE_KINDS, FUND_MILESTONE_LABELS } from "./quebec-closing-fund-flow.constants";

/** Ensure the three standard fund checkpoints exist for the deal (idempotent). */
export async function ensureDefaultClosingFundMilestones(dealId: string): Promise<void> {
  for (const kind of FUND_MILESTONE_KINDS) {
    await prisma.dealClosingFundMilestone.upsert({
      where: { dealId_kind: { dealId, kind } },
      create: { dealId, kind, status: "PENDING" },
      update: {},
    });
  }
}

/** Merge platform payment rows with broker-tracked closing milestones. */
export function summarizeClosingFundFlow(input: {
  payments: LecipmDealPayment[];
  milestones: DealClosingFundMilestone[];
}) {
  const { payments, milestones } = input;
  const deposit = payments.filter((p) => p.paymentKind === "deposit");
  const mortgageOrBalance = payments.filter((p) =>
    ["balance_due", "additional_sum", "trust_release"].includes(p.paymentKind),
  );
  const disbursement = payments.filter((p) => p.status === "released" || p.paymentKind === "trust_release");

  return {
    milestones: milestones.map((m) => ({
      id: m.id,
      kind: m.kind,
      label: (FUND_MILESTONE_LABELS as Record<string, string>)[m.kind] ?? m.kind,
      status: m.status,
      amountCents: m.amountCents,
      currency: m.currency,
      expectedAt: m.expectedAt,
      completedAt: m.completedAt,
      notes: m.notes,
    })),
    paymentRows: payments.map((p) => ({
      id: p.id,
      paymentKind: p.paymentKind,
      status: p.status,
      amountCents: p.amountCents,
      currency: p.currency,
      receivedAt: p.receivedAt,
      confirmedAt: p.confirmedAt,
      releasedAt: p.releasedAt,
      provider: p.provider,
    })),
    counts: {
      deposit: deposit.length,
      balanceOrMortgageRelated: mortgageOrBalance.length,
      released: disbursement.length,
    },
  };
}

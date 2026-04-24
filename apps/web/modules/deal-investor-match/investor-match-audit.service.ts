import { prisma } from "@/lib/db";

/** [investor-match-ai] — action values are fixed for log filters. */
export type InvestorMatchAiAuditAction =
  | "match_generated"
  | "investor_blocked_compliance"
  | "packet_prepared"
  | "investor_selected_by_broker";

export async function recordInvestorMatchAudit(input: {
  dealId: string;
  investorId?: string | null;
  actorUserId?: string | null;
  action: InvestorMatchAiAuditAction;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.dealInvestorMatchAuditLog.create({
      data: {
        dealId: input.dealId,
        investorId: input.investorId ?? null,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        metadata: { source: "investor-match-ai", ...(input.metadata ?? {}) },
      },
    });
  } catch {
    // non-fatal
  }
}

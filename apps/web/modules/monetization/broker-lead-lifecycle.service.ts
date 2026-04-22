import type { PrismaClient } from "@prisma/client";
import { suggestedBrokerSuccessBonusCents } from "@/modules/pricing/pricing.config";

export type BrokerLeadLifecycleVm = {
  leadId: string;
  brokerLeadId: string | null;
  pipelineStatus: string | null;
  billingStatus: string | null;
  /** When lead reached closed/won in CRM (`BrokerLead.status`). */
  closedAtHint: boolean;
  /** Cents suggested when a linked deal completes with platform fee recorded (product tuning). */
  suggestedSuccessBonusCents: number | null;
};

/**
 * Summarize monetization lifecycle for reporting — does not mutate data.
 * Wire `dealPlatformFeeCents` when the closed deal row is known.
 */
export async function buildBrokerLeadLifecycleView(
  db: PrismaClient,
  args: { leadId: string; brokerId: string; dealPlatformFeeCents?: number | null },
): Promise<BrokerLeadLifecycleVm | null> {
  const lead = await db.lead.findUnique({
    where: { id: args.leadId },
    select: { pipelineStatus: true },
  });
  const bl = await db.brokerLead.findFirst({
    where: { leadId: args.leadId, brokerId: args.brokerId },
    select: { id: true, status: true, billingStatus: true },
  });
  if (!lead && !bl) return null;

  const closed =
    bl?.status === "closed" ||
    (lead?.pipelineStatus ?? "").toLowerCase() === "won" ||
    (lead?.pipelineStatus ?? "").toLowerCase() === "closed";

  const fee =
    typeof args.dealPlatformFeeCents === "number" && args.dealPlatformFeeCents > 0
      ? args.dealPlatformFeeCents
      : null;

  return {
    leadId: args.leadId,
    brokerLeadId: bl?.id ?? null,
    pipelineStatus: lead?.pipelineStatus ?? null,
    billingStatus: bl?.billingStatus ?? null,
    closedAtHint: closed,
    suggestedSuccessBonusCents: fee != null ? suggestedBrokerSuccessBonusCents(fee) : null,
  };
}

import { prisma } from "@/lib/db";
import { runCommissionForDeal } from "@/modules/commission-engine/commission-calculation.service";
import { getDefaultOfficeIdForUser } from "@/lib/brokerage/office-access";

/**
 * Idempotent hook: when a deal is accepted/closed, optionally materialize a commission case (broker office context required).
 */
export async function maybeTriggerCommissionCaseForDeal(input: {
  dealId: string;
  actorUserId: string;
  /** When set, skips auto office resolution. */
  officeId?: string | null;
  grossCommissionCents: number;
  /** Only run when deal status matches. */
  dealStatus: string;
}) {
  const s = input.dealStatus.toLowerCase();
  if (!["accepted", "closed", "closing_scheduled"].includes(s)) {
    return { ok: false as const, skipped: true as const, reason: "status_not_commission_trigger" };
  }

  const deal = await prisma.deal.findUnique({
    where: { id: input.dealId },
    select: { brokerId: true, brokerageOfficeId: true },
  });
  if (!deal?.brokerId) {
    return { ok: false as const, error: "No broker on deal" };
  }

  const officeId = input.officeId ?? deal.brokerageOfficeId ?? (await getDefaultOfficeIdForUser(deal.brokerId));
  if (!officeId) {
    return { ok: false as const, error: "No brokerage office context" };
  }

  return runCommissionForDeal({
    dealId: input.dealId,
    officeId,
    actorUserId: input.actorUserId,
    grossCommissionCents: input.grossCommissionCents,
  });
}

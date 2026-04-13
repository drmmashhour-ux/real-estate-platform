import { InsuranceLeadStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { resolveLeadRevenueAmount } from "@/lib/insurance/pricing";

export type TransitionResult =
  | { ok: true; id: string; status: InsuranceLeadStatus }
  | { ok: false; error: string; status: number };

/**
 * Shared status transitions for admin and insurance broker APIs.
 * `CONVERTED` records partner revenue when applicable (same rules as admin route).
 */
export async function transitionInsuranceLeadStatus(
  leadId: string,
  nextStatus: InsuranceLeadStatus
): Promise<TransitionResult> {
  const existing = await prisma.insuranceLead.findUnique({
    where: { id: leadId },
    include: { partner: true },
  });
  if (!existing) {
    return { ok: false, error: "Not found", status: 404 };
  }

  if (nextStatus === InsuranceLeadStatus.CONVERTED) {
    if (existing.status === InsuranceLeadStatus.CONVERTED) {
      return { ok: true, id: leadId, status: InsuranceLeadStatus.CONVERTED };
    }
    const price = resolveLeadRevenueAmount(existing);
    await prisma.$transaction([
      prisma.insuranceLead.update({
        where: { id: leadId },
        data: {
          status: InsuranceLeadStatus.CONVERTED,
          estimatedValue: price,
        },
      }),
      prisma.insuranceRevenueLog.create({
        data: {
          leadId,
          partnerId: existing.partnerId,
          amount: price,
          currency: "CAD",
        },
      }),
    ]);
    return { ok: true, id: leadId, status: InsuranceLeadStatus.CONVERTED };
  }

  const updated = await prisma.insuranceLead.update({
    where: { id: leadId },
    data: { status: nextStatus },
    select: { id: true, status: true },
  });
  return { ok: true, id: updated.id, status: updated.status };
}

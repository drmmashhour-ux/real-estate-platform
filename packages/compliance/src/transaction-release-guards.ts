import { prisma } from "@/lib/db";

export type TrustExportGateInput = {
  dealId: string;
  requiresTrustReconciliation?: boolean;
  requiresInspectionPacket?: boolean;
};

/**
 * Optional hard gates before execution start — enable with LECIPM_REQUIRE_TRUST_RECONCILIATION_FOR_EXECUTION=1
 * and LECIPM_REQUIRE_REGULATOR_EXPORT_FOR_EXECUTION=1 respectively.
 */
export async function assertTrustAndExportGatesForDeal(input: TrustExportGateInput): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const deal = await prisma.deal.findUnique({
    where: { id: input.dealId },
    select: { brokerId: true },
  });
  if (!deal?.brokerId) {
    return { ok: true };
  }

  const ownerType = "solo_broker";
  const ownerId = deal.brokerId;

  if (input.requiresTrustReconciliation) {
    const latest = await prisma.trustReconciliationRun.findFirst({
      where: { ownerType, ownerId },
      orderBy: { createdAt: "desc" },
    });
    if (!latest || latest.differenceCents !== 0) {
      return { ok: false, message: "TRUST_RECONCILIATION_MISMATCH" };
    }
  }

  if (input.requiresInspectionPacket) {
    const latestExport = await prisma.regulatorExportRun.findFirst({
      where: { ownerType, ownerId, status: { in: ["generated", "sealed"] } },
      orderBy: { createdAt: "desc" },
    });
    if (!latestExport) {
      return { ok: false, message: "REGULATOR_EXPORT_REQUIRED" };
    }
  }

  return { ok: true };
}

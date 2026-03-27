import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Counts for AdminHub legal + money control center. */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [
    enforceableContracts,
    platformPaymentsWithContract,
    commissionRows,
    legalDisputesOpen,
    bnhubPaymentsScheduled,
  ] = await Promise.all([
    prisma.contract.count({ where: { type: { startsWith: "enforceable_" }, signed: true } }),
    prisma.platformPayment.count({ where: { linkedContractId: { not: null } } }),
    prisma.platformCommissionRecord.count(),
    prisma.platformLegalDispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
    prisma.payment.count({ where: { scheduledHostPayoutAt: { not: null }, status: "COMPLETED" } }),
  ]);

  return NextResponse.json({
    enforceableSignedContracts: enforceableContracts,
    platformPaymentsLinkedToContract: platformPaymentsWithContract,
    commissionLedgerRows: commissionRows,
    platformLegalDisputesOpen: legalDisputesOpen,
    bnhubPaymentsWithPayoutSchedule: bnhubPaymentsScheduled,
  });
}

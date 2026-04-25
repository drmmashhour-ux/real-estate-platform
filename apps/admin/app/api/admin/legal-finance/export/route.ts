import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** CSV export — commission ledger (last 500 rows). */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.platformCommissionRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      leadId: true,
      dealId: true,
      bookingId: true,
      contractId: true,
      commissionEligible: true,
      commissionSource: true,
      commissionAmountCents: true,
      platformShareCents: true,
      partnerShareCents: true,
      currency: true,
      createdAt: true,
    },
  });

  const header =
    "id,leadId,dealId,bookingId,contractId,commissionEligible,commissionSource,commissionAmountCents,platformShareCents,partnerShareCents,currency,createdAt";
  const lines = rows.map((r) =>
    [
      r.id,
      r.leadId ?? "",
      r.dealId ?? "",
      r.bookingId ?? "",
      r.contractId ?? "",
      r.commissionEligible,
      r.commissionSource ?? "",
      r.commissionAmountCents ?? "",
      r.platformShareCents ?? "",
      r.partnerShareCents ?? "",
      r.currency,
      r.createdAt.toISOString(),
    ].join(",")
  );

  const csv = [header, ...lines].join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="platform-commission-ledger.csv"',
    },
  });
}

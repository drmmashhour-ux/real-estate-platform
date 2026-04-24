import { requireUser } from "@/modules/security/access-guard.service";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/host/finance — host earnings and payout history
 */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    // @ts-ignore
    const entries = await prisma.ledgerEntry.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "desc" },
    });

    const totalEarned = entries
      .filter((e: any) => e.type === "PAYOUT" && e.status === "SUCCEEDED")
      .reduce((acc: number, e: any) => acc + e.amount, 0);

    const pendingPayouts = entries
      .filter((e: any) => e.type === "PAYOUT" && e.status === "PENDING")
      .reduce((acc: number, e: any) => acc + e.amount, 0);

    return NextResponse.json({ 
      entries,
      stats: {
        totalEarned,
        pendingPayouts,
        currency: "USD"
      }
    });
  } catch (error) {
    console.error("[finance:api] failed to fetch host finance", error);
    return NextResponse.json({ error: "Failed to fetch financial data" }, { status: 500 });
  }
}
